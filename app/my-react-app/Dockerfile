# =========================================================================
# Multi-Stage Dockerfile for React SPA (Vite + Tailwind CSS)
# Stage 1: Build the static assets using Node.js
# Stage 2: Serve static production bundle with lightweight Nginx Alpine
# =========================================================================

# -------------------------------------------------------------------------
# Stage 1: Builder
# -------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm ci

# Copy application source code
COPY . .

# Optional Build Argument for Backend API URL (Default: empty string for same-origin reverse proxy)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL


# Build production bundle to /app/dist
RUN npm run build

# -------------------------------------------------------------------------
# Stage 2: Production Web Server
# -------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration supporting SPA client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Healthcheck to verify Nginx is actively serving the SPA index.html
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
