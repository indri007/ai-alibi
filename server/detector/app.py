"""
Desklib AI Text Detector - FastAPI Service (Fixed)
Runs as sidecar: python app.py → listens on port 5000

Changes from original:
  - Model is pre-loaded during startup (lifespan), not lazily on first request
  - /health endpoint now verifies the model is actually loaded
  - /detect has better error messages
  - DESKLIB_MODEL_PATH env var is respected
"""

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import get_detector, warm_up

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("desklib-api")

# ── Model Path ───────────────────────────────────────────
DEFAULT_MODEL_PATH = os.environ.get(
    "DESKLIB_MODEL_PATH",
    str(Path(__file__).resolve().parent.parent / "ai-text-detector-v1.01"),
)

# ── Lifespan ────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the model during startup, not on first request."""
    logger.info(f"Desklib Detector starting (model: {DEFAULT_MODEL_PATH})")
    # Pre-load model during startup
    warm_up()
    yield
    logger.info("Desklib Detector shutting down.")


# ── App ──────────────────────────────────────────────────
app = FastAPI(
    title="Desklib AI Text Detector",
    version="1.0.2",
    lifespan=lifespan,
    description="RAID #1 AI-generated text detection (DeBERTa-v3-large)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ──────────────────────────────────────────────


class DetectRequest(BaseModel):
    text: str = Field(..., min_length=20, description="Text to analyze (min 20 chars)")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Classification threshold")
    max_length: int = Field(default=768, ge=64, le=1024, description="Max token length")


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
    model_loaded: bool


class DetectResponse(BaseModel):
    probability: float
    label: int
    is_ai_generated: bool
    threshold: float
    text_length: int


# ── Endpoints ────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check + model status."""
    detector = None
    model_loaded = False
    device = "cpu"
    try:
        detector = get_detector(DEFAULT_MODEL_PATH)
        model_loaded = detector._loaded
        device = detector.device
    except Exception as e:
        logger.warning("Health check: model not ready: %s", e)

    return HealthResponse(
        status="ok" if model_loaded else "degraded",
        model="desklib/ai-text-detector-v1.01",
        device=device,
        model_loaded=model_loaded,
    )


@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest):
    """Detect whether text is AI-generated."""
    import asyncio

    loop = asyncio.get_event_loop()
    detector = get_detector(DEFAULT_MODEL_PATH)

    if not detector._loaded:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Check service health.",
        )

    try:
        result = await loop.run_in_executor(
            None,
            lambda: detector.predict(
                req.text,
                max_len=req.max_length,
                threshold=req.threshold,
            ),
        )
    except Exception as e:
        logger.error("Inference error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    result["text_length"] = len(req.text)
    return result


# ── Entrypoint ───────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("DESKLIB_PORT", 5000))
    host = os.environ.get("DESKLIB_HOST", "0.0.0.0")

    logger.info("Starting Desklib Detector on %s:%s", host, port)
    uvicorn.run(app, host=host, port=port, log_level="info")
