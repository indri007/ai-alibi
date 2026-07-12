#!/usr/bin/env python3
"""Download desklib model from Hugging Face Hub.

Resolves model path relative to the script location, so it works
both in Docker (/app/ai-text-detector-v1.01) and local dev.
"""

import os
import sys
from pathlib import Path
from huggingface_hub import snapshot_download

# Resolve model path: parent of the directory containing this script
SCRIPT_DIR = Path(__file__).resolve().parent
if SCRIPT_DIR.name == "detector":
    # Running from server/detector/download_model.py -> save to server/../
    MODEL_DIR = SCRIPT_DIR.parent.parent / "ai-text-detector-v1.01"
elif SCRIPT_DIR.name == "server":
    # Running from server/download_model.py
    MODEL_DIR = SCRIPT_DIR.parent / "ai-text-detector-v1.01"
else:
    # Fallback: current working directory
    MODEL_DIR = Path.cwd() / "ai-text-detector-v1.01"

MODEL_DIR = Path(os.environ.get("DESKLIB_MODEL_DIR", str(MODEL_DIR)))

print(f"Downloading model desklib/ai-text-detector-v1.01 to {MODEL_DIR}...")
os.makedirs(MODEL_DIR, exist_ok=True)

snapshot_download(
    repo_id="desklib/ai-text-detector-v1.01",
    local_dir=str(MODEL_DIR),
    local_dir_use_symlinks=False,
    ignore_patterns=["*.h5", "*.ot", "*.msgpack"],
)

# Calculate total size
total = sum(
    os.path.getsize(os.path.join(dp, f))
    for dp, _, fn in os.walk(str(MODEL_DIR))
    for f in fn
)
print(f"✓ Model downloaded! Size: {total / 1024 / 1024:.0f} MB")
print(f"  Location: {MODEL_DIR}")
