# Multi-stage build for StreamSnipe

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

# Install streamlink, ffmpeg, and required dependencies
RUN apk add --no-cache \
    streamlink \
    ffmpeg \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /app/recordings /app/data /app/config

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    RECORDINGS_PATH=/app/recordings \
    DATABASE_PATH=/app/data/streamsnipe.sqlite

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
WORKDIR /app/backend
CMD ["node", "dist/server.js"]

