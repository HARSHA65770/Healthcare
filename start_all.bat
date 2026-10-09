@echo off
echo ======================================================================
echo Launching Autonomous Rural Preventive Healthcare Platform
echo 1. Java Spring Boot + SQL Backend (Port 8000)
echo 2. Frontend React PWA & Doctor Portal (Port 3000)
echo ======================================================================

start "Rural Health Java Spring Boot Backend" cmd /k "cd backend-java && set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT && mvn spring-boot:run -Dmaven.test.skip=true"
timeout /t 3 /nobreak >nul
start "Rural Health React PWA & Portal" cmd /k "cd frontend && npm run dev"

echo Both services launched in separate windows!
echo - Java Backend: http://127.0.0.1:8000
echo - H2 SQL Console: http://127.0.0.1:8000/h2-console
echo - React PWA: http://localhost:3000
pause
