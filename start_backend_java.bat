@echo off
echo ======================================================================
echo Starting Healthcare Platform Java Spring Boot Backend + SQL
echo Server running on http://127.0.0.1:8000
echo H2 SQL Console GUI: http://127.0.0.1:8000/h2-console
echo ======================================================================
cd backend-java
set MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT
mvn spring-boot:run -Dmaven.test.skip=true
pause
