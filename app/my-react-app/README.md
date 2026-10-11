# Frontend Client - Task Management & Notes Dashboard

A modern, highly responsive Single-Page Application (SPA) built with **React**, **Vite**, **Tailwind CSS**, and **Lucide React** communicating with a Node.js/Express backend API.

---

## Tech Stack & Architecture

- **UI Framework:** React 19 (Functional Components, Hooks: `useState`, `useEffect`, `useCallback`)
- **Bundler & Tooling:** Vite 8 (Ultra-fast Hot Module Replacement)
- **Styling:** Tailwind CSS (Modern utility classes, dark theme, responsive grid)
- **Icons:** Lucide React
- **Web Server:** Nginx Alpine (Production multi-stage container with SPA fallback routing)

---

## Key Features

1. **Full CRUD Support:**
   - **Create:** Add new tasks and notes with priority levels, categories, and optional details.
   - **Read:** Fetch live tasks from the Express backend with search and category filter pills.
   - **Delete:** Remove tasks with active loading indicators and feedback toasts.
   - **Status Toggle:** Toggle completion with optimistic UI updates.
2. **Environment Variable Configuration:**
   - Reads `import.meta.env.VITE_API_URL` dynamically with a fallback to `http://localhost:5000`.
3. **Resilient Network Handling:**
   - Visual connection indicator (Green pulse for connected, Red for offline).
   - Informative troubleshooting alert when the backend is unreachable, complete with retry button.
   - Animated shimmer skeletons during initial data fetch.

---

## Environment Variables

Create a `.env` file in the `my-react-app` root directory:

```env
# Backend API Base URL (Default for Express server)
VITE_API_URL=http://localhost:5000
```

> **Note:** During Docker builds, this can be overridden using the `--build-arg VITE_API_URL=<url>` flag.

---

## Local Development (Without Docker)

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Install Dependencies
```bash
cd my-react-app
npm install
```

### 2. Start Vite Development Server
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

## Docker Containerization (Multi-Stage Build)

The frontend uses a two-stage Docker architecture:
1. **Stage 1 (`builder`):** Uses `node:22-alpine` to install dependencies (`npm ci`) and compile the React application into `/app/dist` via Vite.
2. **Stage 2 (`production`):** Uses `nginx:1.27-alpine` to serve static assets with:
   - Client-side Single Page Application routing (`try_files $uri $uri/ /index.html;`)
   - Gzip compression for static text/js/css
   - 1-year immutable caching for hashed assets in `/assets/`
   - Active `HEALTHCHECK` for container health monitoring

### Build the Image
```bash
# Standard build with default backend URL (http://localhost:5000)
docker build -t task-frontend:latest .

# Build with custom backend URL
docker build \
  --build-arg VITE_API_URL=http://your-production-backend:5000 \
  -t task-frontend:latest .
```

### Run the Container
```bash
docker run -d \
  --name task-frontend-container \
  -p 3000:80 \
  task-frontend:latest
```
Access the dashboard in your browser at **`http://localhost:3000`**.

### Verify Container Health & Logs
```bash
# Health status
docker inspect --format='{{json .State.Health.Status}}' task-frontend-container

# Container logs
docker logs -f task-frontend-container
```

### Stop and Clean Up
```bash
docker stop task-frontend-container && docker rm task-frontend-container
```
