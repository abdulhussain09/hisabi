# Production Dockerfile for Hisabi Backend with Headless Chromium & Fonts
FROM node:20-bullseye-slim

# Install Chromium and fonts (including Arabic and Latin font support)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-core \
    fonts-noto-cjk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium environment variables
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install backend dependencies reproducibly via lockfiles
RUN npm ci --omit=dev && cd backend && npm ci --omit=dev

# Copy application source code (including frontend/src needed for SSR rendering)
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend server
CMD ["node", "backend/src/server.js"]
