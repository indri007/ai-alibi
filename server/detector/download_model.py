#!/usr/bin/env python3
"""
Download desklib model from Hugging Face Hub.
Saves to parent of server/detector/ (resolved automatically).

In Docker: /app/ai-text-detector-v1.01
In local:  /path/to/repo/ai-text-detector-v1.01
"""

import os
import sys
from pathlib import Path
from huggingface_hub import snapshot_download

# Resolve: script is in detector/, model goes one level up
SCRIPT_DIR = Path(__file__).resolve().parent  # e.g. /app/detector or .../server/detector
MODEL_DIR = SCRIPT_DIR.parent / "ai-text-detector-v1.01"  # e.g. /app/ or .../server/

# Allow env override
MODEL_DIR = Path(os.environ.get("DESKLIB_MODEL_DIR", str(MODEL_DIR)))

print(f"Downloading model desklib/ai-text-detector-v1.01 → {MODEL_DIR}")
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
