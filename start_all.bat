@echo off
echo ======================================================================
echo Launching Autonomous Rural Preventive Healthcare Platform
echo 1. Backend API & Telemetry Engine (Port 8000)
echo 2. Frontend PWA & Doctor Portal (Port 3000)
echo ======================================================================

start "Rural Health Backend Core API" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "Rural Health PWA & Telemetry Portal" cmd /k "cd frontend && npm run dev"

echo Both services launched in separate windows!
echo - API Docs: http://127.0.0.1:8000/docs
echo - PWA & Portal: http://localhost:3000
pause
