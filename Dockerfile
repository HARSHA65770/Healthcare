# ==============================================================================
# Autonomous Rural Preventive Healthcare Platform - Production Dockerfile
# Multi-stage build: React Frontend + Java Spring Boot 3 Backend + SQL
# ==============================================================================

# Stage 1: Build React PWA Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot Application with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

COPY backend-java/pom.xml ./
COPY backend-java/src ./src

# Copy compiled frontend from Stage 1 into Spring Boot static resources
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Package application into executable jar
RUN mvn clean package -Dmaven.test.skip=true

# Stage 3: Lightweight Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Ensure data directory and /tmp are writable by any container runner user
RUN mkdir -p /app/data && chmod -R 777 /app && chmod 777 /tmp

# Copy built executable JAR from Stage 2
COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8000
EXPOSE 8000

# Start Spring Boot listening on Render's assigned $PORT
CMD ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -jar app.jar --server.port=${PORT:-8000}"]
