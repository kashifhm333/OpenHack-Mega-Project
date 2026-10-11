# =========================================================================
# Multi-Stage Dockerfile for Express.js Backend API
# Stage 1: Dependency resolution & caching
# Stage 2: Minimal, hardened production runtime with non-root user
# =========================================================================

# -------------------------------------------------------------------------
# Stage 1: Dependencies Builder
# -------------------------------------------------------------------------
FROM node:22-alpine AS dependencies

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# -------------------------------------------------------------------------
# Stage 2: Production Runner
# -------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Copy production node_modules from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source files
COPY package.json server.js ./

# Set appropriate ownership to built-in non-root node user for security
RUN chown -R node:node /app

# Switch from root to non-privileged node user
USER node

# Expose backend service port
EXPOSE 5000

# Container healthcheck against /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js server
CMD ["node", "server.js"]
