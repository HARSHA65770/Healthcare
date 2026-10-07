#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Building Frontend (React + Vite PWA) ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Installing Backend Dependencies (FastAPI + Uvicorn) ==="
pip install -r backend/requirements.txt

echo "=== Build Complete ==="
