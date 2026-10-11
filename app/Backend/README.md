# Backend Service - Task Management & Notes API

A resilient, production-ready REST API built with **Node.js 22** and **Express.js**, supporting persistent storage with **MongoDB / Mongoose** (with graceful in-memory fallback), structured health checks, and containerized deployment on **Amazon EKS**.

---

## 🚀 Tech Stack & Architecture

- **Runtime:** Node.js v22 (Alpine-based Linux container)
- **Framework:** Express.js 4.x
- **Database:** MongoDB 7.0 via Mongoose (with in-memory fallback if no `MONGO_URI` is configured)
- **Middleware:** `cors` (Cross-Origin Resource Sharing), `express.json()` body parser
- **Security:** Hardened multi-stage Docker build executing under least-privilege non-root user (`USER node`)
- **Kubernetes:** Orchestrated via `k8s/backend.yaml` as a Deployment with anti-affinity, readiness/liveness probes, and a `ClusterIP` Service on port `5000`.

---

## ⚙️ Environment Variables

The backend dynamically configures itself from environment variables (provided locally via `.env` or in Kubernetes via `app-config` and `app-secrets`):

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port for Express HTTP server |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development` or `production`) |
| `MONGO_URI` | Optional | `undefined` | Full MongoDB connection string (e.g., `mongodb://user:pass@mongodb-service:27017/taskdb?authSource=admin`) |
| `DB_NAME` | Optional | `taskdb` | Target MongoDB database name |

> [!NOTE]
> If `MONGO_URI` is not provided, the API automatically falls back to an in-memory task collection, allowing offline local development without running a local MongoDB instance.

---

## 📡 API Specification

Base URL: `http://localhost:5000` (Local) or `/api` (Production behind Nginx)

| Method | Endpoint | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & uptime monitor | `{"status":"ok","uptime":152.4,"api":"Task Management API"}` |
| `GET` | `/api/tasks` | Fetch list of all tasks | Returns JSON array of task objects |
| `POST` | `/api/tasks` | Create a new task / note | **Body:** `{"title":"...","category":"DevOps","priority":"high"}` |
| `PATCH` | `/api/tasks/:id` | Update attributes or toggle complete | **Body:** `{"completed": true}` |
| `DELETE`| `/api/tasks/:id` | Delete task by ID | `{"message":"Task deleted successfully","id":"..."}` |

### Task Data Model
```json
{
  "id": "1",
  "title": "Set up CI/CD pipeline on GitHub Actions",
  "description": "Configure automated linting, test suite execution, and Docker build.",
  "category": "DevOps",
  "priority": "high",
  "completed": false,
  "createdAt": "2026-10-11T05:00:00.000Z"
}
```

---

## 💻 Local Development (Without Docker)

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Install Dependencies
```bash
cd app/Backend
npm install
```

### 2. Start the Server
```bash
# Standard start
npm start

# Development mode with hot-reload
npm run dev
```
The server will start listening at `http://localhost:5000`.

---

## 🐳 Docker Containerization (Multi-Stage Build)

The backend features a secure multi-stage `Dockerfile`:
1. **Stage 1 (`dependencies`):** Resolves `package.json` & `package-lock.json` and runs `npm ci --omit=dev` to produce lean production dependencies without dev tools.
2. **Stage 2 (`runner`):** Runs on clean `node:22-alpine`, switches to non-root `USER node`, and configures a `HEALTHCHECK` against `/api/health`.

### Build Image
```bash
cd app/Backend
docker build -t task-backend:latest .
```

### Run Container
```bash
docker run -d \
  --name task-backend-container \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  task-backend:latest
```

---

## ☸️ Kubernetes Integration

In the production Kubernetes cluster, the backend is defined in [`k8s/backend.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/backend.yaml):
- **Deployment:** 2 Replicas with pod anti-affinity across cluster nodes.
- **Service:** Internal `ClusterIP` on port `5000` accessible to the frontend at `http://backend-service.production.svc.cluster.local:5000`.
- **Config & Secrets:** Ingested from `app-config` ([`configmap.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/configmap.yaml)) and `app-secrets` ([`secrets.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/secrets.yaml)).
- **Probes:** HTTP probes configured on `/api/health` for both readiness and liveness.
- **Autoscaling:** Scaled dynamically between 2 and 5 pods via Horizontal Pod Autoscaler ([`k8s/hpa.yaml`](file:///home/kashifhm333/Desktop/Project/devops/k8s/hpa.yaml)).
