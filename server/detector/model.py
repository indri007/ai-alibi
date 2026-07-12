"""
Desklib AI Text Detector - Model Loader & Inference (Fixed)
Model: desklib/ai-text-detector-v1.01 (RAID #1)
Architecture: DeBERTa-v3-large + Mean Pooling + Linear Classifier
"""

import torch
import torch.nn as nn
import traceback
import types
from pathlib import Path
import logging

from transformers import (
    AutoTokenizer,
    AutoConfig,
    PreTrainedModel,
    DebertaV2Config,
    DebertaV2Model,
)

logger = logging.getLogger("desklib-detector")


class DesklibAIDetectionModel(PreTrainedModel):
    """
    Custom model class matching desklib's architecture.
    
    Architecture:
      - Base: DeBERTa-v3-large (DebertaV2Model)
      - Mean pooling over token embeddings (weighted by attention mask)
      - Linear classifier -> single logit (BCE)
    
    Fixes applied:
      - config_class = DebertaV2Config (was AutoConfig = wrong)
      - Uses DebertaV2Model directly (was AutoModel = implicit)
      - Uses post_init() (was init_weights = deprecated)
      - Registered with _keys_to_ignore_on_load_missing for DeBERTa compatibility
    """
    config_class = DebertaV2Config
    base_model_prefix = "model"
    supports_gradient_checkpointing = False
    _keys_to_ignore_on_load_missing = [
        r"model.embeddings.position_ids",
        r"model.embeddings.token_type_ids",
    ]

    def __init__(self, config):
        super().__init__(config)
        # Use explicit DebertaV2Model instead of AutoModel for clarity
        self.model = DebertaV2Model(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        # Initialize weights properly (modern transformers)
        self.post_init()

    def forward(self, input_ids, attention_mask=None, labels=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden_state = outputs[0]

        # Mean pooling (weighted by attention mask)
        input_mask_expanded = (
            attention_mask.unsqueeze(-1)
            .expand(last_hidden_state.size())
            .float()
        )
        sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
        pooled_output = sum_embeddings / sum_mask

        # Binary classifier
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

        # Load tokenizer
        logger.info("Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_path))

        # Load model with custom class
        logger.info("Loading DesklibAIDetectionModel...")
        self.model = DesklibAIDetectionModel.from_pretrained(
            str(self.model_path),
            ignore_mismatched_sizes=True,
        )
        self.model.to(self.device)
        self.model.eval()

        self._loaded = True
        logger.info("Model loaded successfully on %s.", self.device)

    def predict(self, text: str, max_len: int = 768, threshold: float = 0.5) -> dict:
        """Run inference on a single text.

        Args:
            text: Input text to analyze
            max_len: Maximum token length (DeBERTa default: 768)
            threshold: Classification threshold (0.5 = balanced)

        Returns:
            dict with probability, label, is_ai_generated, threshold
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


# ── Singleton ──────────────────────────────────────────────
_detector: Detector | None = None


def resolve_model_path(override_path: str | None = None) -> str:
    """Resolve the model path, trying several candidate locations."""
    candidates = []

    # Explicit override wins
    if override_path:
        candidates.append(override_path)

    # Docker: /app/ai-text-detector-v1.01  (Cloud Run, Dockerfile.desklib)
    candidates.append(str(Path("/app/ai-text-detector-v1.01")))

    # Local dev: repo-root/ai-text-detector-v1.01
    here = Path(__file__).resolve().parent  # detector/
    repo_root = here.parent                 # server/
    candidates.append(str(repo_root / "ai-text-detector-v1.01"))

    # Local dev alternative: repo-root/
    workspace = here.parent.parent          # repo-root (Docker build context root)
    candidates.append(str(workspace / "ai-text-detector-v1.01"))

    # First existing path wins
    for p in candidates:
        path = Path(p)
        logger.info(f"Checking model path: {path} (exists={path.exists()})")
        if path.exists() and (path / "config.json").exists():
            files = [f.name for f in path.glob("*") if f.suffix in (".json", ".safetensors", ".bin", ".model")]
            logger.info(f"  Found model files: {files[:8]}")
            return str(path)

    raise FileNotFoundError(
        f"Model not found in any candidate path. Tried:\n  " + "\n  ".join(candidates)
    )


def get_detector(model_path: str | None = None) -> Detector:
    """Get or create the global Detector singleton.

    First call loads the model. Subsequent calls reuse the cached instance.
    If loading fails, logs the full traceback and raises (no silent fallback).
    """
    global _detector
    if _detector is None:
        try:
            path = resolve_model_path(model_path)
            logger.info(f"Resolved model path: {path}")
            _detector = Detector(path)
            _detector.load()
            logger.info("✓ Detector ready.")
        except Exception:
            logger.error("✗ Failed to initialize detector:\n%s", traceback.format_exc())
            raise
    return _detector


def warm_up():
    """Pre-load the detector (called during startup, not on first request)."""
    logger.info("Warming up detector...")
    try:
        get_detector()
        logger.info("✓ Warm-up complete.")
    except Exception as e:
        logger.warning("Warm-up failed (detection will try on first request): %s", e)
