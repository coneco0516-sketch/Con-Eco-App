# --- Stage 1: Build the Frontend (Memory Efficient) ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend

# Copy lockfile and package.json to use 'npm ci'
COPY Frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# Copy all frontend source files
COPY Frontend/ ./
# Limit memory to fit in standard Railway build instances (often 512MB)
ENV NODE_OPTIONS="--max-old-space-size=448"
RUN npm run build

# --- Stage 2: Productive Backend ---
FROM python:3.11-slim
WORKDIR /app

# Install Python requirements
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt

# Copy backend code
COPY Backend/ ./Backend/

# Copy built frontend from Stage 1 into the backend's expected path
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Set working directory to Backend to run uvicorn
WORKDIR /app/Backend

# Expose port and start
ENV PORT=8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
