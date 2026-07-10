"""
Desklib AI Text Detector - Model Loader & Inference
Model: desklib/ai-text-detector-v1.01 (RAID #1)
Architecture: DeBERTa-v3-large + Mean Pooling + Linear Classifier
"""

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoConfig, PreTrainedModel
from pathlib import Path
import logging

logger = logging.getLogger("desklib-detector")


class DesklibAIDetectionModel(PreTrainedModel):
    """Custom model class matching desklib's architecture."""
    config_class = AutoConfig

    def __init__(self, config):
        super().__init__(config)
        from transformers import AutoModel
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.init_weights()

    def forward(self, input_ids, attention_mask=None, labels=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs[0]

        # Mean pooling
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).float()
        sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
        pooled_output = sum_embeddings / sum_mask

        # Classifier
        logits = self.classifier(pooled_output)

        loss = None
        if labels is not None:
            loss_fct = nn.BCEWithLogitsLoss()
            loss = loss_fct(logits.view(-1), labels.float())

        output = {"logits": logits}
        if loss is not None:
            output["loss"] = loss
        return output


class Detector:
    """Wrapper for model inference."""

    def __init__(self, model_path: str | Path, device: str | None = None):
        self.model_path = Path(model_path)
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self._loaded = False

    def load(self):
        """Load tokenizer and model from disk."""
        logger.info(f"Loading model from {self.model_path} on {self.device}...")

        self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_path))
        self.model = DesklibAIDetectionModel.from_pretrained(str(self.model_path))
        self.model.to(self.device)
        self.model.eval()

        self._loaded = True
        logger.info("Model loaded successfully.")

    def predict(self, text: str, max_len: int = 768, threshold: float = 0.5) -> dict:
        """Run inference on a single text.

        Args:
            text: Input text to analyze
            max_len: Maximum token length (DeBERTa default: 768)
            threshold: Classification threshold (0.5 = balanced)

        Returns:
            dict: {
                "probability": float (0-1),
                "label": int (1=AI, 0=Human),
                "is_ai_generated": bool,
                "threshold": float
            }
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call .load() first.")

        if not text or not text.strip():
            return {"error": "Empty text provided"}

        encoded = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=max_len,
            return_tensors="pt",
        )
        input_ids = encoded["input_ids"].to(self.device)
        attention_mask = encoded["attention_mask"].to(self.device)

        with torch.no_grad():
            outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs["logits"]
            probability = torch.sigmoid(logits).item()

        is_ai = probability >= threshold
        return {
            "probability": round(probability, 4),
            "label": 1 if is_ai else 0,
            "is_ai_generated": bool(is_ai),
            "threshold": threshold,
        }


# Singleton for reuse across requests
_detector: Detector | None = None


def get_detector(model_path: str | None = None) -> Detector:
    """Get or create the global Detector singleton."""
    global _detector
    if _detector is None:
        # Resolve: from Creative-Alibi/server/detector/ -> workspace root
        base = Path(__file__).resolve().parent.parent.parent.parent
        path = model_path or str(base / "ai-text-detector-v1.01")
        _detector = Detector(path)
        _detector.load()
    return _detector
