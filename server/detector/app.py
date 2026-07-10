"""
Desklib AI Text Detector - FastAPI Service
Runs as sidecar: python app.py → listens on port 5000
"""

import os
import logging
from pathlib import Path

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import get_detector

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
    """Start server immediately, model loads lazily on first request."""
    logger.info(f"Desklib Detector starting. Model path: {DEFAULT_MODEL_PATH}")
    yield


# ── App ──────────────────────────────────────────────────
app = FastAPI(
    title="Desklib AI Text Detector",
    version="1.0.1",
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


class DetectResponse(BaseModel):
    probability: float
    label: int
    is_ai_generated: bool
    threshold: float
    text_length: int





# ── Endpoints ────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "model": "desklib/ai-text-detector-v1.01", "device": "cpu"}


@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest):
    """Detect whether text is AI-generated."""
    import asyncio
    loop = asyncio.get_event_loop()
    detector = get_detector(DEFAULT_MODEL_PATH)

    try:
        result = await loop.run_in_executor(
            None,
            lambda: detector.predict(req.text, max_len=req.max_length, threshold=req.threshold),
        )
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    result["text_length"] = len(req.text)
    return result


# ── Entrypoint ───────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("DESKLIB_PORT", 5000))
    host = os.environ.get("DESKLIB_HOST", "127.0.0.1")

    logger.info(f"Starting Desklib Detector on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
