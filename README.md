# Full-Stack DevOps Project: Task Management & Notes Dashboard

A modern, production-ready full-stack application featuring a **React 19 (Vite + Tailwind CSS)** frontend and an **Express.js (Node.js)** backend API, fully containerized using **multi-stage Docker builds** and orchestrated with **Docker Compose**.

---

## Architecture Overview

```text
               +--------------------------------------------+
               |                Client Browser              |
               +--------------------------------------------+
                                      |
                      HTTP :3000      |      REST API :5000
                      (Web Assets)    |      (JSON Payload)
                                      v
       +--------------------------------+--------------------------------+
       |                                |                                |
       v                                v                                v
+------------------------------+                 +-------------------------------+
|     Frontend Container       |                 |       Backend Container       |
|  (Nginx 1.27 Alpine)         |                 |   (Node.js 22 Alpine / Express|
|  - Static React SPA assets   |                 |   - REST API (/api/tasks)     |
|  - SPA client-side routing   |                 |   - Healthcheck (/api/health) |
|  - Gzip & static caching     |                 |   - Hardened non-root user    |
+------------------------------+                 +-------------------------------+
       |                                                         |
       +------------------- Docker Bridge Network ---------------+
```

---

## Repository Structure

```text
devops/
├── docker-compose.yml             # Orchestration for frontend & backend services
├── README.md                      # Overall project documentation & DevOps guide
│
├── Backend/                       # Express.js REST API Service
│   ├── Dockerfile                 # Multi-stage production Dockerfile (node:22-alpine)
│   ├── .dockerignore              # Docker build context exclusions
│   ├── package.json               # Node.js project manifest & scripts
│   ├── package-lock.json          # Deterministic dependency lockfile
│   ├── server.js                  # Express API server with CORS & CRUD routes
│   └── README.md                  # Dedicated Backend documentation & API spec
│
└── my-react-app/                  # React Single-Page Application
    ├── Dockerfile                 # Multi-stage Dockerfile (Node build -> Nginx serve)
    ├── .dockerignore              # Docker build context exclusions
    ├── nginx.conf                 # Custom Nginx SPA configuration & headers
    ├── .env                       # Vite environment variables (VITE_API_URL)
    ├── .env.example               # Template environment configuration
    ├── index.html                 # App shell with Plus Jakarta Sans typography
    ├── package.json               # Frontend dependencies (React, Tailwind, Lucide)
    ├── vite.config.js             # Vite configuration with Tailwind CSS plugin
    ├── README.md                  # Dedicated Frontend documentation
    └── src/
        ├── api.js                 # API service helper with error handling & timeout
        ├── App.jsx                # Main dashboard state machine (CRUD, search, filter)
        ├── main.jsx               # React entry point
        ├── index.css              # Tailwind base imports & custom styles
        └── components/
            ├── Header.jsx         # Responsive navigation header with API status
            ├── TaskForm.jsx       # Task/note creation form with validation
            ├── TaskCard.jsx       # Responsive item card with priority & delete
            ├── LoadingSkeleton.jsx# Animated pulse skeletons during data fetching
            ├── ErrorAlert.jsx     # Friendly error banner with troubleshooting tips
            └── Toast.jsx          # Non-blocking notification toasts
```

---

## Quickstart with Docker Compose

The easiest way to run the entire stack is with Docker Compose:

```bash
# Clone or navigate to the project directory
cd /home/kashifhm333/Desktop/Project/devops

# Build and start all containers in detached mode
docker compose up --build -d
```

### Access Applications:
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Stop and Teardown:
```bash
docker compose down
```

---

## Standalone Docker Commands

You can also build and run each service independently.

### 1. Backend Service

```bash
cd /home/kashifhm333/Desktop/Project/devops/Backend

# Build image
docker build -t task-backend:latest .

# Run container
docker run -d \
  --name task-backend \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  task-backend:latest
```

### 2. Frontend Service

```bash
cd /home/kashifhm333/Desktop/Project/devops/my-react-app

# Build image (optionally pass VITE_API_URL build argument)
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  -t task-frontend:latest .

# Run container
docker run -d \
  --name task-frontend \
  -p 3000:80 \
  task-frontend:latest
```

---

## Local Development (Without Docker)

If developing locally without containers:

### Step 1: Start the Backend
```bash
cd /home/kashifhm333/Desktop/Project/devops/Backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*

### Step 2: Start the Frontend
```bash
cd /home/kashifhm333/Desktop/Project/devops/my-react-app
npm install
npm run dev
```
*Frontend runs on Vite dev server at `http://localhost:5173`.*

---

## DevOps & Containerization Best Practices Implemented

| Category | Implementation | Benefit |
| :--- | :--- | :--- |
| **Multi-Stage Builds** | Separate `builder` & `production` stages for both apps | Excludes devDependencies, Node compilers, and source code from final images; reduces image size by >70%. |
| **Minimal Base Images** | `node:22-alpine` and `nginx:1.27-alpine` | Drastically minimizes container footprint, attack surface, and vulnerability surface (CVEs). |
| **Non-Root Execution** | Built-in `USER node` applied in Backend container | Adheres to least-privilege security principle. |
| **Container Healthchecks** | `HEALTHCHECK` directives querying `/api/health` and `/` | Docker Engine and orchestrators can detect and restart degraded containers automatically. |
| **Layer Caching** | Copying `package.json` & `package-lock.json` before source code | Prevents reinstalling dependencies when only application code changes. |
| **Nginx Web Server** | Custom `nginx.conf` with SPA routing and Gzip | Resolves client-side routing 404s, delivers pre-compressed assets, and sets 1-year immutable cache on static bundles. |
| **Environment Decoupling**| Dynamic `import.meta.env.VITE_API_URL` with runtime fallback | Allows pointing to different backend environments without altering code. |

---

## API Quick Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check and uptime status |
| `/api/tasks` | `GET` | List all tasks |
| `/api/tasks` | `POST` | Create a new task/note |
| `/api/tasks/:id` | `PATCH` | Update task or toggle completion |
| `/api/tasks/:id` | `DELETE` | Delete task by ID |

---

## Documentation Links

- [Backend Documentation (`Backend/README.md`)](file:///home/kashifhm333/Desktop/Project/devops/Backend/README.md)
- [Frontend Documentation (`my-react-app/README.md`)](file:///home/kashifhm333/Desktop/Project/devops/my-react-app/README.md)
- [Docker Compose Spec (`docker-compose.yml`)](file:///home/kashifhm333/Desktop/Project/devops/docker-compose.yml)
