#!/usr/bin/env python3
"""Download desklib model from Hugging Face Hub"""
import os
from huggingface_hub import snapshot_download

model_path = '/app/ai-text-detector-v1.01'
print(f'Downloading model desklib/ai-text-detector-v1.01...')
os.makedirs(model_path, exist_ok=True)

snapshot_download(
    repo_id='desklib/ai-text-detector-v1.01',
    local_dir=model_path,
    local_dir_use_symlinks=False,
    ignore_patterns=['*.h5', '*.ot', '*.msgpack']
)

total = sum(os.path.getsize(os.path.join(dp,f)) for dp,_,fn in os.walk(model_path) for f in fn)
print(f'Model downloaded! Size: {total / 1024 / 1024:.0f} MB')
