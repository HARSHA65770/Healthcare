# ==============================================================================
# Autonomous Rural Preventive Healthcare Platform - Production Dockerfile
# Multi-stage build: Frontend (Node/Vite) + Backend (Python/FastAPI)
# ==============================================================================

# Stage 1: Build React PWA Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Environment (FastAPI + Uvicorn)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default port
ENV PORT=8000
EXPOSE 8000

# Start Uvicorn bound to all interfaces and Render's assigned $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
