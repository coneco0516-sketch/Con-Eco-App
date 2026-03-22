# --- Stage 1: Build the Frontend ---
FROM node:22-slim AS frontend-builder
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# --- Stage 2: Productive Backend ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if any needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Copy backend code
COPY Backend/ ./Backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Set working directory to Backend to run uvicorn
WORKDIR /app/Backend

# Expose port and start
ENV PORT=8000
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
