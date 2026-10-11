# Enterprise 3-Tier DevOps Project: Task Management & Notes Platform

A production-grade, highly available full-stack application featuring a **React 19 (Vite + Tailwind CSS)** frontend, an **Express.js (Node.js 22)** backend API, and a **MongoDB** database. Fully containerized with multi-stage Docker builds, provisioned with **Terraform (IaC)**, and orchestrated on **Amazon EKS (Kubernetes)** with automated **GitHub Actions CI/CD**.

---

## 🌐 Live Global Deployment

The application is deployed live on AWS and accessible globally over the internet:

* **Live Web Application:** [http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com](http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com)
* **API Health Check:** [http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com/api/health](http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com/api/health)
* **Tasks API:** [http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com/api/tasks](http://a8958e80b2dec4a329ba054438c06eb5-d422843e84cb6759.elb.ap-southeast-2.amazonaws.com/api/tasks)

---

## 🏛️ System Architecture

```text
                               +-----------------------------+
                               |     Public Internet User    |
                               +-----------------------------+
                                              |
                                              | HTTP (Port 80)
                                              v
                      +-----------------------------------------------+
                      |   AWS Network Load Balancer (Internet-Facing)  |
                      |   (a8958e80b2dec4a329ba054438c06eb5-*.elb)    |
                      +-----------------------------------------------+
                                              |
                                              v  production namespace
       +=============================================================================+
       | Amazon EKS Cluster (eks-prod-cluster, ap-southeast-2)                        |
       |                                                                             |
       |  +-----------------------------------------------------------------------+  |
       |  | Frontend Service (LoadBalancer -> NodePort 31572)                     |  |
       |  +-----------------------------------------------------------------------+  |
       |         |                                        |                          |
       |         v                                        v                          |
       |  [Frontend Pod 1]                         [Frontend Pod 2]                  |
       |  - Nginx 1.27 Alpine                      - Nginx 1.27 Alpine               |
       |  - React SPA Static Assets                - React SPA Static Assets         |
       |  - Reverse Proxy (/api/ -> Backend)       - Reverse Proxy (/api/ -> Backend)|
       |         |                                        |                          |
       |         +-------------------+--------------------+                          |
       |                             | HTTP :5000                                    |
       |                             v                                               |
       |  +-----------------------------------------------------------------------+  |
       |  | Backend Service (ClusterIP: backend-service:5000)                     |  |
       |  +-----------------------------------------------------------------------+  |
       |         |                                        |                          |
       |         v                                        v                          |
       |  [Backend Pod 1]                          [Backend Pod 2]                   |
       |  - Node.js 22 Alpine                      - Node.js 22 Alpine               |
       |  - Express REST API                       - Express REST API                |
       |  - Ingests ConfigMaps & Secrets           - Ingests ConfigMaps & Secrets    |
       |         |                                        |                          |
       |         +-------------------+--------------------+                          |
       |                             | TCP :27017                                    |
       |                             v                                               |
       |  +-----------------------------------------------------------------------+  |
       |  | Database Service (ClusterIP: mongodb-service:27017)                   |  |
       |  +-----------------------------------------------------------------------+  |
       |                             |                                               |
       |                             v                                               |
       |                     [MongoDB Pod 1]                                         |
       |                     - Mongo 7.0 Deployment                                  |
       |                     - Authenticated Root Credentials                        |
       +=============================================================================+
```

---

## 📂 Repository Structure

```text
devops/
├── README.md                      # Primary project & architecture documentation
│
├── .github/
│   └── workflows/
│       ├── deploy.yaml            # CI/CD: Terraform IaC, ECR builds & EKS deployment
│       └── destroy.yaml           # Automated cloud resource cleanup & teardown
│
├── app/
│   ├── Backend/                   # Node.js 22 / Express.js REST API service
│   │   ├── Dockerfile             # Hardened multi-stage build (node:22-alpine)
│   │   ├── server.js              # Express app with Mongoose & CRUD routes
│   │   ├── package.json           # Backend dependencies (express, cors, mongoose)
│   │   └── README.md              # Backend-specific documentation
│   │
│   └── my-react-app/              # React 19 / Vite single-page application
│       ├── Dockerfile             # Multi-stage build (Node build -> Nginx serve)
│       ├── nginx.conf             # Nginx reverse proxy (/api/) & SPA router
│       ├── src/                   # React components, state & API service layer
│       ├── package.json           # Frontend dependencies (Tailwind, Lucide, Vite)
│       └── README.md              # Frontend-specific documentation
│
├── k8s/                           # Production Kubernetes Manifests
│   ├── backend.yaml               # Backend Deployment & ClusterIP Service
│   ├── deployment.yaml            # Frontend Deployment (anti-affinity, probes)
│   ├── service.yaml               # Frontend AWS Network Load Balancer Service
│   ├── mongodb.yaml               # MongoDB Deployment & Service
│   ├── configmap.yaml             # Application ConfigMap (NODE_ENV, DB_NAME, etc.)
│   ├── secrets.yaml               # Opaque Secrets (MongoDB credentials, URIs)
│   ├── hpa.yaml                   # Horizontal Pod Autoscalers (Frontend & Backend)
│   └── pdb.yaml                   # Pod Disruption Budgets (High Availability)
│
├── terraform/                     # Infrastructure as Code (AWS)
│   ├── main.tf                    # Root module orchestrating VPC, EKS, and ECR
│   ├── variables.tf               # Input variables (region, CIDRs, node sizing)
│   ├── terraform.tfvars           # Environment variable definitions
│   ├── outputs.tf                 # Cluster name, ECR URLs, OIDC endpoints
│   └── modules/
│       ├── vpc/                   # Multi-AZ VPC with public/private subnets & NAT
│       ├── eks/                   # AWS EKS cluster v1.36 & managed node group
│       └── ecr/                   # Elastic Container Registry with scan on push
│
└── scripts/
    └── destroy.sh                 # Local cleanup & graceful teardown helper
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide React, Nginx 1.27 Alpine |
| **Backend API** | Node.js 22, Express.js 4, Mongoose (MongoDB ODM), CORS |
| **Database** | MongoDB 7.0 with authenticated role access |
| **Containerization** | Docker Multi-Stage Builds, Non-Root Linux user (`node`), Alpine images |
| **Orchestration** | Amazon EKS (Kubernetes 1.36), Helm, Kubectl |
| **Infrastructure as Code** | Terraform 1.10, AWS Provider |
| **Cloud Provider (AWS)** | VPC, Subnets, NAT Gateways, EKS, ECR, Network Load Balancer (NLB) |
| **CI / CD** | GitHub Actions (`deploy.yaml`, `destroy.yaml`) with AWS OIDC/Credentials |

---

## 🚀 Deployment Guide

### Prerequisites
- [AWS CLI](https://aws.amazon.com/cli/) configured with administrative privileges
- [Terraform](https://www.terraform.io/) `>= 1.5.0`
- [kubectl](https://kubernetes.io/docs/tasks/tools/) matching your cluster version
- [Docker](https://docs.docker.com/)

---

### Method 1: Automated CI/CD (GitHub Actions)

Pushing changes to the `main` branch automatically triggers the `.github/workflows/deploy.yaml` pipeline:
1. Bootstraps S3 remote state storage for Terraform.
2. Runs `terraform init` and `terraform apply -auto-approve` to provision VPC, EKS, and ECR.
3. Builds and scans multi-stage Docker images for both frontend and backend.
4. Pushes tagged images to Amazon ECR.
5. Updates kubeconfig and executes rolling deployments to EKS with health check validations.

---

### Method 2: Manual / CLI Provisioning

#### Step 1: Provision Infrastructure with Terraform
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

Update your local `kubectl` configuration to connect to the newly created EKS cluster:
```bash
aws eks update-kubeconfig --region ap-southeast-2 --name eks-prod-cluster
```

#### Step 2: Build & Push Container Images to Amazon ECR
```bash
# Authenticate Docker to Amazon ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com

# 1. Build and push backend image
cd ../app/Backend
docker build -t <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/my-webapp:backend-latest .
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/my-webapp:backend-latest

# 2. Build and push frontend image
cd ../my-react-app
docker build -t <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/my-webapp:latest .
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/my-webapp:latest
```

#### Step 3: Deploy to Kubernetes
```bash
cd ../../k8s

# Create namespace and apply secrets & configs
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy database, backend and frontend
kubectl apply -f mongodb.yaml
kubectl apply -f backend.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Apply auto-scaling and high-availability policies
kubectl apply -f hpa.yaml
kubectl apply -f pdb.yaml
```

#### Step 4: Verify Deployment & Retrieve Load Balancer URL
```bash
# Check all running pods, services, and HPAs in the production namespace
kubectl get all -n production

# Retrieve the external NLB endpoint
kubectl get svc my-webapp-service -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 💻 Local Development (Without Kubernetes)

### 1. Run the Backend Locally
```bash
cd app/Backend
npm install

# Start in development mode (defaults to in-memory tasks if MONGO_URI is unset)
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Run the Frontend Locally
```bash
cd app/my-react-app
npm install

# Start Vite dev server
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🛡️ DevOps & Reliability Highlights

* **Zero-Downtime Rolling Updates:** Kubernetes deployments use `maxSurge: 1` and `maxUnavailable: 0` along with configured TCP / HTTP readiness and liveness probes.
* **Auto-Scaling (HPA):** Both frontend and backend automatically scale from 2 to 5 replicas based on CPU threshold utilization (75%).
* **High Availability (Anti-Affinity & PDB):** Pod anti-affinity prevents colocation of identical service pods on the same node; Pod Disruption Budgets guarantee minimum replica availability during maintenance.
* **Hardened Security:**
  * Backend containers run as non-root user `USER node`.
  * Multi-stage builds strip compilers and development dependencies, reducing image attack surfaces.
  * Secrets (MongoDB credentials) are managed in decoupled Kubernetes Secret resources.
* **Production Nginx Proxy:** Eliminates client-side CORS configuration issues in production by routing `/api/*` requests internally within the cluster network directly to the backend service.

---

## 🧹 Teardown & Clean Up

To destroy all provisioned AWS cloud resources:

```bash
# Option 1: Trigger GitHub Actions workflow dispatch on destroy.yaml
# Option 2: Execute the local teardown script
chmod +x scripts/destroy.sh
./scripts/destroy.sh
```

---

## 🔗 Component Documentation

- [Backend Documentation (`app/Backend/README.md`)](file:///home/kashifhm333/Desktop/Project/devops/app/Backend/README.md)
- [Frontend Documentation (`app/my-react-app/README.md`)](file:///home/kashifhm333/Desktop/Project/devops/app/my-react-app/README.md)
- [Kubernetes Manifests (`k8s/`)](file:///home/kashifhm333/Desktop/Project/devops/k8s)
- [Terraform Modules (`terraform/`)](file:///home/kashifhm333/Desktop/Project/devops/terraform)
