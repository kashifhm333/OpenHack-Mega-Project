# Frontend Client - Task Management & Notes Dashboard

A modern, responsive Single-Page Application (SPA) built with **React 19**, **Vite**, **Tailwind CSS**, and **Lucide React**. Containerized with a multi-stage **Nginx 1.27 Alpine** build that serves optimized static assets and reverse-proxies API traffic to the backend service.

---

## 🚀 Tech Stack & Architecture

- **UI Framework:** React 19 (Functional Components & Hooks)
- **Tooling & Bundler:** Vite 8 (Ultra-fast builds and Hot Module Replacement)
- **Styling:** Tailwind CSS (Dark-themed glassmorphism UI, responsive layout)
- **Icons:** Lucide React
- **Web Server:** Nginx 1.27 Alpine (Multi-stage production image)
- **Internal API Proxy:** Nginx routes `/api/*` directly to `backend-service.production.svc.cluster.local:5000` within the Kubernetes cluster, eliminating cross-origin browser complications.

---

## ✨ Features

1. **Full CRUD State Machine:**
   - **Create:** Fast modal/form to post new tasks with title, category, description, and priority level.
   - **Read:** Live data ingestion from the Express backend with category filtering and keyword search.
   - **Update/Toggle:** Instant optimistic UI updates when marking tasks complete.
   - **Delete:** Interactive deletion with visual status indicators and non-blocking toast alerts.
2. **Resilient Network Handling:**
   - Dynamic API helper (`src/api.js`) with request timeouts (10s) and detailed error diagnostics.
   - Live backend connectivity badge (Green for connected, Red for offline).
   - Animated shimmer pulse skeletons during initial data fetches.
3. **Optimized Delivery:**
   - Pre-configured Gzip compression in Nginx.
   - 1-year immutable caching on hashed static assets in `/assets/`.

---

## ⚙️ Environment Variables

For local development, environment variables are managed in `.env`:

```env
# Optional: explicitly set backend URL during local dev (defaults to http://localhost:5000)
VITE_API_URL=http://localhost:5000
```

> [!NOTE]
> In production on Kubernetes, `VITE_API_URL` is intentionally empty so all requests use relative paths (`/api/tasks`). Nginx then proxies them internally to the cluster backend.

---

## 💻 Local Development (Without Docker)

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Install Dependencies
```bash
cd app/my-react-app
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🐳 Docker Containerization (Multi-Stage Build)

The frontend uses a two-stage `Dockerfile`:
1. **Stage 1 (`builder`):** Uses `node:22-alpine` to install dependencies (`npm ci`) and compile the production bundle into `/app/dist` via Vite.
2. **Stage 2 (`production`):** Copies compiled assets to `nginx:1.27-alpine` and attaches `nginx.conf`:
   - Single Page Application routing (`try_files $uri $uri/ /index.html;`)
   - Internal reverse proxy for `/api/` to `backend-service.production.svc.cluster.local:5000`
   - Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`)
   - Gzip compression and static caching

### Build the Image
```bash
cd app/my-react-app
docker build -t task-frontend:latest .
```

### Run Container Locally
```bash
docker run -d \
  --name task-frontend-container \
  -p 3000:80 \
  task-frontend:latest
```
Access at `http://localhost:3000`.

---

## ☸️ Kubernetes Integration

In the production Kubernetes cluster:
- **Deployment:** Defined in [`k8s/deployment.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/deployment.yaml) with 2 replicas, pod anti-affinity, and TCP readiness/liveness probes on port 80.
- **Service:** Defined in [`k8s/service.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/service.yaml) as an AWS Network Load Balancer (NLB) with `internet-facing` scheme:
  ```yaml
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
  ```
- **Autoscaling:** Scaled dynamically via [`k8s/hpa.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/hpa.yaml) (2 to 5 replicas).
