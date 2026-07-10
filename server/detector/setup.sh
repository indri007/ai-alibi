#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Desklib AI Detector - Setup Script
# ──────────────────────────────────────────────────────────
# Creates a virtual environment and installs Python dependencies.
#
# Usage:
#   chmod +x setup.sh && ./setup.sh
#
# Then start the service:
#   ./venv/bin/python app.py
# ──────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="${SCRIPT_DIR}/venv"

echo "🔧 Setting up Desklib AI Detector..."

# Create virtual environment if needed
if [ ! -d "$VENV_DIR" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate and install
source "${VENV_DIR}/bin/activate"

echo "   Upgrading pip..."
pip install --upgrade pip --quiet

echo "   Installing dependencies (PyTorch, Transformers, FastAPI)..."
pip install -r "${SCRIPT_DIR}/requirements.txt"

echo ""
echo "✅ Done! Model: desklib/ai-text-detector-v1.01"
echo ""
echo "🚀 To start the service:"
echo "   ${VENV_DIR}/bin/python ${SCRIPT_DIR}/app.py"
echo ""
echo "   Or with custom port:"
echo "   DESKLIB_PORT=5000 ${VENV_DIR}/bin/python ${SCRIPT_DIR}/app.py"
echo ""
echo "📡 Node.js server connects to http://127.0.0.1:5000"
echo ""
