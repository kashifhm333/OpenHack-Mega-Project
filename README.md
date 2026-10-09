# Production-Grade AWS Kubernetes & GitOps Platform

[![Infrastructure: Terraform](https://img.shields.io/badge/IaC-Terraform_1.3+-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloud: AWS](https://img.shields.io/badge/Cloud-Amazon_Web_Services-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Registry: Amazon ECR](https://img.shields.io/badge/Registry-Amazon_ECR-FF4F8B?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ecr/)
[![Orchestration: Kubernetes EKS](https://img.shields.io/badge/Orchestration-Amazon_EKS-326CE5?logo=kubernetes&logoColor=white)](https://aws.amazon.com/eks/)
[![CI/CD: GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)

A lean, modular, and production-grade cloud platform foundation engineered for running containerized workloads on **Amazon Web Services (AWS)**. This repository provisions secure, multi-AZ cloud infrastructure using **Terraform**, automates delivery with **GitHub Actions**, and orchestrates highly available microservices on **Amazon Elastic Kubernetes Service (EKS)** with **Amazon Elastic Container Registry (ECR)**.

---

## Table of Contents

- [1. Architecture Overview & Component Breakdown](#1-architecture-overview--component-breakdown)
  - [Architecture Workflow](#architecture-workflow)
  - [Core Platform Components](#core-platform-components)
  - [Build-Time vs. Runtime Separation](#build-time-vs-runtime-separation)
- [2. Prerequisites & AWS IAM Configuration](#2-prerequisites--aws-iam-configuration)
  - [Cloud & Local Tooling Requirements](#cloud--local-tooling-requirements)
  - [AWS IAM Permissions & Credentials](#aws-iam-permissions--credentials)
  - [GitHub Actions Secret Configuration](#github-actions-secret-configuration)
- [3. Configuration Guide (What to Change)](#3-configuration-guide-what-to-change)
  - [Terraform Variable Customization](#terraform-variable-customization)
  - [CI/CD Workflow Alignment](#cicd-workflow-alignment)
  - [Kubernetes Manifest Alignment](#kubernetes-manifest-alignment)
- [4. Step-by-Step Guide for Integrating a Future Web Application](#4-step-by-step-guide-for-integrating-a-future-web-application)
  - [Step 1: Add Application Source Code](#step-1-add-application-source-code)
  - [Step 2: Add a Production-Grade Multi-Stage Dockerfile](#step-2-add-a-production-grade-multi-stage-dockerfile)
  - [Step 3: Add a `.dockerignore` File](#step-3-add-a-dockerignore-file)
  - [Step 4: Synchronize Ports in Kubernetes Manifests](#step-4-synchronize-ports-in-kubernetes-manifests)
  - [Step 5: Commit and Trigger the GitOps Pipeline](#step-5-commit-and-trigger-the-gitops-pipeline)
  - [Step 6: Post-Deployment Verification](#step-6-post-deployment-verification)
- [5. Repository Structure](#5-repository-structure)
- [6. Troubleshooting & Operational Runbook](#6-troubleshooting--operational-runbook)

---

## 1. Architecture Overview & Component Breakdown

This platform enforces clean separation of concerns across infrastructure provisioning, automated image delivery, and cluster workload orchestration.

```mermaid
flowchart TD
    subgraph Local_or_DevOps["DevOps & IaC Provisioning"]
        TF[Terraform CLI] -->|Provisions Multi-AZ| VPC[AWS VPC & Subnets]
        TF -->|Provisions Scan & Lifecycle| ECR[Amazon ECR Repository]
        TF -->|Provisions Control Plane| EKS[Amazon EKS Cluster]
        TF -->|Attaches Managed Node Group| Nodes[EC2 Worker Nodes (t3.medium)]
        TF -->|Configures Policies| IAM[IAM Roles (EKS, CNI, ECR Pull)]
    end

    subgraph CI_CD["GitHub Actions Pipeline"]
        Code[Git Push to main] --> Auth[Configure AWS Credentials]
        Auth --> LoginECR[Log into Amazon ECR]
        LoginECR --> Buildx[Docker Buildx with GHA Cache]
        Buildx -->|Push SHA & latest tags| ECR
        Buildx --> ConnectEKS[aws eks update-kubeconfig]
        ConnectEKS --> DeployK8s[Deploy Manifests to EKS]
        DeployK8s --> Rollout[Zero-Downtime Rollout Verification]
    end

    subgraph Runtime["Amazon EKS Cluster (containerd Runtime)"]
        DeployK8s -->|kubectl apply -f k8s/| NS[Namespace: production]
        NS --> CM[ConfigMap: app-config]
        NS --> Deploy[Deployment: my-webapp-deployment]
        NS --> HPA[HPA: 2 to 4 Pods]
        NS --> PDB[PDB: minAvailable: 1]
        Deploy -->|Pulls from ECR with IAM auth| ECR
        Deploy --> NLB[Network Load Balancer Service: Port 80 -> 3000]
        NLB --> Internet((Public Traffic))
    end
```

### Core Platform Components

1. **Modular Terraform (`terraform/`)**:
   - **VPC Module (`modules/vpc/`)**: Deploys an isolated VPC across multiple AWS Availability Zones (`ap-southeast-2a`, `ap-southeast-2b`) equipped with an Internet Gateway, route tables, and required Kubernetes subnet discovery tags (`kubernetes.io/role/elb = "1"`).
   - **ECR Module (`modules/ecr/`)**: Provisions an enterprise container registry featuring:
     - `scan_on_push = true` for vulnerability scanning on image push.
     - `AES256` server-side encryption.
     - Lifecycle policy automatically pruning untagged dangling images and retaining the last 30 tagged versions.
   - **EKS Module (`modules/eks/`)**:
     - Provisions a managed EKS control plane (Kubernetes v1.30) with control plane audit/API logging.
     - Dedicated EKS IAM cluster role (`AmazonEKSClusterPolicy`, `AmazonEKSVPCResourceController`).
     - EKS Managed Node Group running cost-effective `t3.medium` instances across multiple AZs.
     - Worker node IAM role granting `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, and native `AmazonEC2ContainerRegistryReadOnly` for seamless, credential-free image pulls.
   - **Root Orchestration (`main.tf`)**: Coordinates module dependency graph and injects unified AWS provider tags (`Environment = "production"`, `ManagedBy = "Terraform"`).

2. **Continuous Integration & Delivery (`.github/workflows/deploy.yaml`)**:
   - Executes upon push to the `main` branch.
   - Authenticates to AWS via `aws-actions/configure-aws-credentials@v4` and `aws-actions/amazon-ecr-login@v2`.
   - Leverages `docker/setup-buildx-action` and `docker/build-push-action` with GitHub Actions cache (`type=gha,mode=max`) for accelerated builds.
   - Tags images with both the immutable Git commit SHA (`${{ github.sha }}`) and `:latest`.
   - Connects to EKS via `aws eks update-kubeconfig`.
   - Creates/validates the `production` namespace and applies all manifests in `k8s/`.
   - Runs `kubectl set image` to bind the deployment to the exact Git commit SHA and monitors rollout health with `kubectl rollout status`.

3. **Kubernetes Workload Orchestration (`k8s/`)**:
   - **`configmap.yaml`**: Decouples application configuration (`NODE_ENV`, `PORT`, `AWS_REGION`) from container images.
   - **`deployment.yaml`**: Configured with `replicas: 2`, `RollingUpdate` strategy (`maxSurge: 1`, `maxUnavailable: 0`), non-root security context (`runAsNonRoot: true`, `runAsUser: 10001`), resource requests/limits, and TCP health probes.
   - **`service.yaml`**: Provisions an external AWS Network Load Balancer (NLB) using annotations `service.beta.kubernetes.io/aws-load-balancer-type: "nlb"` and `service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"`.
   - **`hpa.yaml`**: Horizontal Pod Autoscaler dynamically scaling between 2 and 5 replicas based on CPU (75%) and memory (80%) thresholds.
   - **`pdb.yaml`**: Enforces `minAvailable: 1` to guarantee zero downtime during EKS node upgrades and cluster maintenance.

---

### Build-Time vs. Runtime Separation

| Dimension | Build-Time (CI Engine) | Runtime (Kubernetes Cluster) |
| :--- | :--- | :--- |
| **Execution Environment** | GitHub Actions Runner (`ubuntu-latest`) | Amazon EKS Cluster (`containerd` runtime on EC2) |
| **Tools Used** | Docker Buildx, BuildKit, QEMU, compilers, package managers | Kubernetes API server, kubelet, containerd, AWS VPC CNI |
| **Artifact Produced** | Read-only OCI container images pushed to Amazon ECR | Isolated Linux containers running inside cgroups/namespaces |
| **Security Surface** | Compiles code, runs tests, requires ephemeral CI credentials | **No compilers or build tools installed.** Runs strictly non-root with dropped Linux capabilities. |
| **Responsibility** | Hermetic builds, vulnerability scanning, artifact tagging | High availability, health checks, auto-scaling, ingress traffic routing |

---

## 2. Prerequisites & AWS IAM Configuration

### Cloud & Local Tooling Requirements

- **AWS Account**: Active AWS account with permissions for EKS, ECR, VPC, EC2, and IAM.
- **AWS CLI (`aws`)**: Version `2.x` installed (`aws --version`).
- **Terraform CLI**: Version `>= 1.3.0` installed (`terraform version`).
- **Kubernetes CLI (`kubectl`)**: Version `1.28+` installed (`kubectl version --client`).
- **Docker Engine**: Installed locally for building and debugging container images.

---

### AWS IAM Permissions & Credentials

To enable GitHub Actions and local Terraform provisioning, prepare an IAM identity (or GitHub Actions OIDC Role) with policies for:
- `AmazonEKSClusterPolicy`, `AmazonEKSServicePolicy`
- `AmazonEC2ContainerRegistryFullAccess` (or scoped ECR push permissions)
- `AmazonVPCFullAccess` & `IAMFullAccess` (for creating cluster and node group roles)

Generate Access Keys for your CI/CD service identity:
```bash
# Verify identity
aws sts get-caller-identity
```

---

### GitHub Actions Secret Configuration

Navigate to your GitHub repository:
1. Click **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Add the following secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID.
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key.
4. Click **Add secret**.

> **Pro Tip (OIDC Authentication):** For enterprise zero-secret setups, configure GitHub Actions OpenID Connect (OIDC) with AWS STS `AssumeRoleWithWebIdentity` using `role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/<ROLE_NAME>`.

---

## 3. Configuration Guide (What to Change)

### Terraform Variable Customization

Review [terraform/terraform.tfvars](file:///home/kashifhm333/Desktop/openhack/terraform/terraform.tfvars) and adapt it to your target region and scaling requirements:

```hcl
# File: terraform/terraform.tfvars

# Target AWS Region
aws_region          = "ap-southeast-2"

# Environment Identifier
environment         = "production"

# EKS Cluster Name
cluster_name        = "eks-prod-cluster"

# Kubernetes Control Plane Version
cluster_version     = "1.30"

# ECR Repository Name
ecr_repository_name = "my-webapp"

# Availability Zones
availability_zones  = ["ap-southeast-2a", "ap-southeast-2b"]

# EC2 Node Pool Instance Type (Burstable, general-purpose)
node_instance_types = ["t3.medium"]

# Worker Node Scaling Parameters
desired_node_count  = 2
min_node_count      = 1
max_node_count      = 4
```

To provision infrastructure:
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

---

### CI/CD Workflow Alignment

Ensure the environment variables in [.github/workflows/deploy.yaml](file:///home/kashifhm333/Desktop/openhack/.github/workflows/deploy.yaml) match your Terraform settings:

```yaml
# File: .github/workflows/deploy.yaml
env:
  AWS_REGION: ap-southeast-2         # Must match var.aws_region
  ECR_REPOSITORY: my-webapp          # Must match var.ecr_repository_name
  EKS_CLUSTER_NAME: eks-prod-cluster  # Must match var.cluster_name
  APP_NAME: my-webapp                # Workload identifier
```

---

### Kubernetes Manifest Alignment

In [k8s/deployment.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/deployment.yaml), the deployment references your ECR repository URL. The CI/CD pipeline dynamically injects the exact commit SHA tag upon each deployment.

---

## 4. Step-by-Step Guide for Integrating a Future Web Application

### Step 1: Add Application Source Code

Place your web application files into the repository root. For example, a production Node.js service:

`src/index.js`:
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    cloud: 'AWS',
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Application running on port ${PORT}`);
});
```

---

### Step 2: Add a Production-Grade Multi-Stage Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# ==========================================
# Stage 2: Hardened Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Create non-root user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

COPY --chown=appuser:appgroup --from=builder /usr/src/app ./

USER 10001:10001

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "src/index.js"]
```

---

### Step 3: Add a `.dockerignore` File

Create `.dockerignore` in the root directory:

```text
node_modules
.git
.github
terraform
.terraform
.terraform.lock.hcl
*.tfstate*
k8s
README.md
.env
npm-debug.log
```

---

### Step 4: Synchronize Ports in Kubernetes Manifests

If your web application listens on a port other than `3000` (e.g., `8080`), update:
1. `containerPort`, `readinessProbe`, and `livenessProbe` in [k8s/deployment.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/deployment.yaml).
2. `targetPort` in [k8s/service.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/service.yaml).
3. `PORT` in [k8s/configmap.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/configmap.yaml).

---

### Step 5: Commit and Trigger the GitOps Pipeline

Push your code to GitHub:

```bash
git add .
git commit -m "feat: configure AWS production infrastructure and automated GitOps deployment"
git push origin main
```

Monitor the execution under **Actions** in GitHub:
1. AWS credentials configured.
2. Amazon ECR authenticated.
3. Multi-stage Docker image built with BuildKit and pushed with commit SHA and `latest`.
4. EKS cluster kubeconfig fetched.
5. Kubernetes manifests applied to `production` namespace.
6. Deployment image updated to immutable SHA tag and zero-downtime rollout verified.

---

### Step 6: Post-Deployment Verification

Verify deployment directly from your local terminal:

```bash
# 1. Connect local kubectl to the Amazon EKS cluster
aws eks update-kubeconfig --region ap-southeast-2 --name eks-prod-cluster

# 2. Inspect running pods
kubectl get pods -n production -o wide

# 3. Retrieve the AWS Network Load Balancer external hostname
kubectl get svc my-webapp-service -n production

# Example output:
# NAME                TYPE           CLUSTER-IP     EXTERNAL-IP                                                               PORT(S)        AGE
# my-webapp-service   LoadBalancer   172.20.10.45   k8s-production-mywebapp-xxxxxx.elb.ap-southeast-2.amazonaws.com           80:31245/TCP   5m

# 4. Test public endpoint
curl -i http://<EXTERNAL-HOSTNAME>/
```

---

## 5. Repository Structure

```
openhack/
├── .github/
│   └── workflows/
│       └── deploy.yaml         # AWS ECR Build & EKS GitOps Pipeline
├── k8s/
│   ├── configmap.yaml          # Externalized Application Configuration
│   ├── deployment.yaml         # Hardened Workload Deployment (Non-root, Probes, Resources)
│   ├── service.yaml            # AWS Network Load Balancer (NLB) Ingress
│   ├── hpa.yaml                # Horizontal Pod Autoscaler (2-5 pods)
│   └── pdb.yaml                # Pod Disruption Budget (minAvailable: 1)
├── terraform/
│   ├── main.tf                 # Root Module & AWS Provider Integration
│   ├── variables.tf            # Global Infrastructure Variables
│   ├── outputs.tf              # Endpoints & Kubeconfig Helper Command
│   ├── terraform.tfvars        # Active Production Configuration
│   └── modules/
│       ├── vpc/                # Multi-AZ VPC, Subnets & Routing Module
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── ecr/                # Amazon ECR with Scanning & Lifecycle Policy
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       └── eks/                # Amazon EKS Control Plane & Managed Node Group
│           ├── main.tf
│           ├── variables.tf
│           └── outputs.tf
└── README.md                   # Platform Architecture & Operations Manual
```

---

## 6. Troubleshooting & Operational Runbook

### Issue: `ImagePullBackOff` or `ErrImagePull`
- **Cause**: EKS Node Group IAM role lacks permissions to read from Amazon ECR, or the image does not exist.
- **Fix**: Verify that the IAM role attached to the managed node group has the `AmazonEC2ContainerRegistryReadOnly` policy attached. Also verify that the image name in ECR matches `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/my-webapp`.

### Issue: LoadBalancer External-IP Shows `<pending>`
- **Cause**: AWS is creating the Network Load Balancer (NLB) and registering target instances. This typically takes 1–3 minutes.
- **Fix**: Inspect the service events:
  ```bash
  kubectl describe service my-webapp-service -n production
  ```
  Ensure your public subnets carry the tag `kubernetes.io/role/elb = "1"`.

### Issue: `kubectl` Access Denied / Unauthorized to EKS
- **Cause**: The IAM entity running `kubectl` was not the creator of the EKS cluster or is not mapped in EKS access entries / `aws-auth`.
- **Fix**: Ensure you run `aws eks update-kubeconfig` with the same IAM credentials used by Terraform during cluster creation, or add your IAM ARN to the EKS cluster access configuration.

### Issue: Pods stuck in `CrashLoopBackOff`
- **Cause**: Application container process failed startup, crashed on port binding, or failed the TCP health probe.
- **Fix**: Inspect pod container logs:
  ```bash
  kubectl logs -l app=my-webapp -n production --tail=100
  kubectl describe pod -l app=my-webapp -n production
  ```

---

**Crafted with precision for resilient, cost-effective, and scalable cloud engineering on AWS.**
