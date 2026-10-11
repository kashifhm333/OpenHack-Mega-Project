# =========================================================================
# Root Multi-Stage Dockerfile for React SPA
# Enables building directly from root context: docker build -t my-webapp .
# =========================================================================

# Stage 1: Build React static assets
FROM node:22-alpine AS builder
WORKDIR /app
COPY app/my-react-app/package.json app/my-react-app/package-lock.json ./
RUN npm ci
COPY app/my-react-app/ .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY app/my-react-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
