#!/usr/bin/env python3
"""Health check for Desklib Detector - verifies model is actually loaded."""
import json
import urllib.request

try:
    resp = urllib.request.urlopen("http://localhost:5000/health", timeout=10)
    data = json.loads(resp.read().decode())
    assert data.get("status") == "ok", f"Status: {data.get('status')}"
    assert data.get("model_loaded"), "Model not loaded"
    print(f"HEALTHY: model loaded on {data.get('device')}")
except Exception as e:
    print(f"UNHEALTHY: {e}")
    exit(1)
