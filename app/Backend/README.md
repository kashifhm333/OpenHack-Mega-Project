# Backend Service - Task Management & Notes API

A lightweight, production-ready REST API built with **Node.js** and **Express.js** providing CRUD capabilities and health monitoring for the Task Management & Notes Dashboard.

---

## Tech Stack & Architecture

- **Runtime:** Node.js v22 (Alpine-based container)
- **Framework:** Express.js 4.x
- **Middleware:** `cors` (enables cross-origin communication with frontend), `express.json()`
- **Deployment:** Containerized multi-stage Docker build with non-root security execution

---

## API Specification

Base URL: `http://localhost:5000` (or `PORT` environment variable)

| Method | Endpoint | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck & uptime monitor | `{"status":"ok","uptime":12.4,"api":"..."}` |
| `GET` | `/api/tasks` | Fetch list of all tasks | Returns array of task objects |
| `POST` | `/api/tasks` | Create a new task/note | **Body:** `{"title":"...","category":"DevOps","priority":"high"}` |
| `PATCH` | `/api/tasks/:id` | Update attributes or toggle complete | **Body:** `{"completed": true}` |
| `DELETE`| `/api/tasks/:id` | Delete task by ID | `{"message":"Task deleted successfully","id":"..."}` |

### Task Data Schema

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

## Local Development (Without Docker)

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Run the Server
```bash
# Standard start
npm start

# Or with Node.js hot reload watcher
npm run dev
```
Server will be available at `http://localhost:5000`.

---

## Docker Containerization (Multi-Stage Build)

The backend features a hardened multi-stage `Dockerfile`:
1. **Stage 1 (`dependencies`):** Resolves `package.json` & `package-lock.json` and runs `npm ci --omit=dev` to only include lean production dependencies.
2. **Stage 2 (`runner`):** Runs on a clean `node:22-alpine` base image, applies non-root permissions (`USER node`), configures a `HEALTHCHECK` against `/api/health`, and launches the Express server.

### Build the Image
```bash
docker build -t task-backend:latest .
```

### Run the Container
```bash
docker run -d \
  --name task-backend-container \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  task-backend:latest
```

### Verify Container Health
```bash
# Inspect container health status
docker inspect --format='{{json .State.Health.Status}}' task-backend-container

# Check logs
docker logs -f task-backend-container
```

### Stop and Clean Up
```bash
docker stop task-backend-container && docker rm task-backend-container
```
