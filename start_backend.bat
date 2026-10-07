@echo off
echo ======================================================================
echo Starting Autonomous Rural Preventive Healthcare Platform Core API
echo FastAPI + Uvicorn + WebSockets on http://127.0.0.1:8000
echo ======================================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
