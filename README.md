# Production-Grade Azure Kubernetes & GitOps Platform

[![Infrastructure: Terraform](https://img.shields.io/badge/IaC-Terraform_1.3+-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloud: Azure](https://img.shields.io/badge/Cloud-Microsoft_Azure-0078D4?logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![Containers: Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes_AKS-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![CI/CD: GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Config: Ansible](https://img.shields.io/badge/Config_Mgmt-Ansible-EE0000?logo=ansible&logoColor=white)](https://www.ansible.com/)

A lean, modular, and production-grade cloud foundation engineered for running containerized workloads on **Microsoft Azure**. This repository provisions secure, immutable infrastructure using **Terraform**, automates delivery with **GitHub Actions** and **Ansible** configuration management, and orchestrates highly available microservices on **Azure Kubernetes Service (AKS)**.

---

## Table of Contents

- [1. Architecture Overview & Component Breakdown](#1-architecture-overview--component-breakdown)
  - [Architecture Workflow](#architecture-workflow)
  - [Core Pipeline Components](#core-pipeline-components)
  - [Build-Time vs. Runtime Separation](#build-time-vs-runtime-separation)
- [2. Prerequisites & Required Secrets](#2-prerequisites--required-secrets)
  - [Cloud & Local Tooling Requirements](#cloud--local-tooling-requirements)
  - [Service Principal & Role-Based Access Control (RBAC)](#service-principal--role-based-access-control-rbac)
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

This project enforces separation of concerns across infrastructure provisioning, container delivery, and cluster state management.

```mermaid
flowchart TD
    subgraph Local_or_DevOps["DevOps & IaC Provisioning"]
        TF[Terraform CLI] -->|Provisions| RG[Azure Resource Group]
        TF -->|Provisions| ACR[Azure Container Registry]
        TF -->|Provisions| AKS[AKS Cluster (Standard_B2s)]
        TF -->|Assigns AcrPull Role| Role[Managed Identity Role Assignment]
    end

    subgraph CI_CD["GitHub Actions Pipeline"]
        Code[Git Push to main] --> Lint[Job: Lint & Static Analysis]
        Lint --> Buildx[Job: Docker Buildx with GHA Cache]
        Buildx -->|Push tagged image| ACR
        Buildx --> AnsibleHooks[Ansible Configuration / Pre-flight Validation]
        AnsibleHooks --> DeployK8s[Deploy Manifests to AKS]
    end

    subgraph Runtime["AKS Cluster (containerd Runtime)"]
        DeployK8s -->|kubectl apply -f k8s/| NS[Namespace: production]
        NS --> CM[ConfigMap: app-config]
        NS --> Deploy[Deployment: my-webapp-deployment]
        NS --> HPA[HPA: 2 to 5 Pods]
        NS --> PDB[PDB: minAvailable: 1]
        Deploy -->|Pulls acrprodminimal101.azurecr.io/...| ACR
        Deploy --> SVC[LoadBalancer Service: port 80 -> 3000]
        SVC --> Internet((Public Traffic))
    end
```

### Core Pipeline Components

1. **Modular Terraform (`terraform/`)**:
   - **Resource Group Module (`modules/resource_group/`)**: Encapsulates resource grouping, regional boundary enforcement, and governance tagging.
   - **Azure Container Registry Module (`modules/acr/`)**: Deploys an enterprise container registry (`Basic` SKU for budget efficiency) storing versioned OCI artifacts.
   - **Azure Kubernetes Service Module (`modules/aks/`)**: Provisions a managed Kubernetes control plane with a cost-optimized `Standard_B2s` VM burstable node pool and system-assigned managed identity.
   - **Root Orchestration (`main.tf`)**: Ties all modules together and automates the crucial `AcrPull` role assignment between the AKS Kubelet Managed Identity and the ACR resource scope—enabling seamless, credential-free image pulls.

2. **Continuous Integration & Automation (`.github/workflows/deploy.yaml`)**:
   - Manages end-to-end execution upon pushes to `main`.
   - Uses `docker/setup-buildx-action` and `docker/build-push-action` with GitHub Actions cache (`type=gha,mode=max`) to optimize build times and minimize outbound bandwidth.
   - Generates semantic, immutable container image tags using Git commit SHA (`${{ github.sha }}`) along with `:latest`.
   - Authenticates directly into Azure via the official Azure CLI action and fetches cluster credentials into a transient runner environment.

3. **Configuration Management & Ansible Hooks**:
   - Acts as the operational bridge between raw infrastructure and running workloads.
   - Runs idempotent pre-flight checks, verifies cluster health, provisions namespaces, validates dynamic environment secrets, and injects runtime configurations into target clusters.

4. **Kubernetes Workload Orchestration (`k8s/`)**:
   - **`configmap.yaml`**: Decouples environment variables (`NODE_ENV`, `PORT`) from container images.
   - **`deployment.yaml`**: Configured with `replicas: 2`, `RollingUpdate` strategy (`maxSurge: 1`, `maxUnavailable: 0`), non-root security contexts (`runAsNonRoot: true`, `runAsUser: 10001`), resource requests/limits, and TCP health probes.
   - **`service.yaml`**: Provisions an external Azure Load Balancer routing port `80` to targetPort `3000`.
   - **`hpa.yaml`**: Horizontal Pod Autoscaler dynamically scaling between 2 and 5 replicas on CPU (75%) and memory (80%) thresholds.
   - **`pdb.yaml`**: Guarantees zero downtime by enforcing `minAvailable: 1` during AKS node drains and upgrades.

---

### Build-Time vs. Runtime Separation

A cornerstone of production-grade systems is maintaining absolute isolation between **Build-Time** and **Runtime**:

| Dimension | Build-Time (CI Engine) | Runtime (Kubernetes Cluster) |
| :--- | :--- | :--- |
| **Execution Environment** | GitHub Actions Ubuntu Runner (`ubuntu-latest`) | Azure Kubernetes Service (`containerd` CRI) |
| **Tools Used** | Docker Buildx, BuildKit, QEMU, compilers, package managers | Kubernetes API server, kubelet, containerd, Azure CNI |
| **Artifact Produced** | Read-only OCI container images pushed to ACR | Active Linux processes inside isolated cgroups & namespaces |
| **Security Surface** | Compiles code, runs tests, creates layers; needs ephemeral build secrets | **No compilers or build tools installed.** Runs strictly non-root with read-only root filesystem capabilities. |
| **Responsibility** | Guarantees reproducible, hermetic builds and artifact signatures | Enforces high availability, health checks, auto-scaling, and traffic ingress |

---

## 2. Prerequisites & Required Secrets

### Cloud & Local Tooling Requirements

Ensure you have the following installed on your local workstation:
- **Azure Account**: Active subscription (such as Azure Pay-As-You-Go or Azure for Students).
- **Azure CLI (`az`)**: Version `2.50.0+` installed (`curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`).
- **Terraform CLI**: Version `>= 1.3.0` installed (`terraform version`).
- **Kubernetes CLI (`kubectl`)**: Version `1.28+` (`az aks install-cli`).
- **Docker Engine**: Installed locally for building and debugging images.

---

### Service Principal & Role-Based Access Control (RBAC)

GitHub Actions needs permission to authenticate with Azure, push to ACR, and manage AKS deployments. Generate an Azure Service Principal with the `Contributor` role over your active subscription:

```bash
# 1. Log into Azure CLI
az login

# 2. Retrieve your Subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Active Subscription ID: ${SUBSCRIPTION_ID}"

# 3. Create Service Principal with Contributor privileges
az ad sp create-for-rbac \
  --name "sp-github-actions-prod" \
  --role "Contributor" \
  --scopes "/subscriptions/${SUBSCRIPTION_ID}" \
  --sdk-auth
```

> **Security Note:** The `--sdk-auth` flag produces a JSON block specifically formatted for GitHub's `azure/login` action.

The command outputs a JSON payload structured like this:

```json
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "11111111-1111-1111-1111-111111111111",
  "tenantId": "22222222-2222-2222-2222-222222222222",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

---

### GitHub Actions Secret Configuration

Navigate to your GitHub repository:
1. Click **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Name: `AZURE_CREDENTIALS`
4. Value: Paste the **exact JSON payload** returned by `az ad sp create-for-rbac`.
5. Click **Add secret**.

---

## 3. Configuration Guide (What to Change)

Before running the pipeline, synchronize names across your infrastructure, workflow, and manifests.

### Terraform Variable Customization

Review [terraform/terraform.tfvars](file:///home/kashifhm333/Desktop/openhack/terraform/terraform.tfvars) and adapt it to your naming convention and Azure region:

```hcl
# File: terraform/terraform.tfvars

# Azure Resource Group Name
rg_name      = "rg-prod-k8s"

# Azure Geographic Region (e.g., "East US", "West Europe", "Central US")
location     = "East US"

# ACR Name: MUST BE GLOBALLY UNIQUE across all Azure accounts (alphanumeric only, no hyphens)
acr_name     = "acrprodminimal101"

# AKS Managed Cluster Name
cluster_name = "aks-prod-cluster"

# Cluster DNS Prefix (alphanumeric)
dns_prefix   = "aksprod"

# VM SKU for Node Pool (Standard_B2s is low-cost; use Standard_D2s_v5 for heavy workloads)
vm_size      = "Standard_B2s"

# Worker Node Count
node_count   = 1
```

> **Warning:** Azure Container Registry names are globally unique public DNS endpoints (`<acr_name>.azurecr.io`). If another user in the world owns `acrprodminimal101`, choose your own unique identifier (e.g., `acrprodcompany2026`).

---

### CI/CD Workflow Alignment

Ensure environment variables in [.github/workflows/deploy.yaml](file:///home/kashifhm333/Desktop/openhack/.github/workflows/deploy.yaml) match your `terraform.tfvars`:

```yaml
# File: .github/workflows/deploy.yaml
env:
  AZURE_RESOURCE_GROUP: rg-prod-k8s         # Must match var.rg_name
  AZURE_CLUSTER_NAME: aks-prod-cluster       # Must match var.cluster_name
  AZURE_ACR_NAME: acrprodminimal101          # Must match var.acr_name
  APP_NAME: my-webapp                        # Your application/image name
```

---

### Kubernetes Manifest Alignment

In [k8s/deployment.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/deployment.yaml), ensure the `image` field points to your ACR login server:

```yaml
# File: k8s/deployment.yaml (Lines 26-27)
containers:
- name: my-webapp
  image: acrprodminimal101.azurecr.io/my-webapp:latest  # <acr_name>.azurecr.io/<app_name>:latest
```

---

## 4. Step-by-Step Guide for Integrating a Future Web Application

Follow this operational runbook when your application source code is ready to integrate:

### Step 1: Add Application Source Code

Place your application files in the project root or inside an `app/` directory. For example, a production Node.js/Express service:

```
openhack/
├── src/
│   └── index.js
├── package.json
├── package-lock.json
...
```

Example `src/index.js`:
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', version: process.env.npm_package_version || '1.0.0' });
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

Create a `Dockerfile` in the root directory. Multi-stage builds keep your image slim, drop build tools from the final image, and run as a non-privileged user:

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

# Security: Create non-root user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Copy dependencies and source from builder stage
COPY --chown=appuser:appgroup --from=builder /usr/src/app ./

# Drop privileges
USER 10001:10001

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "src/index.js"]
```

---

### Step 3: Add a `.dockerignore` File

Create `.dockerignore` in the root directory to keep local artifacts, git history, and secrets out of the build context:

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

If your web application listens on a port other than `3000` (e.g. `8080`), update two files:

1. **[k8s/deployment.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/deployment.yaml)**:
   ```yaml
   ports:
   - name: http
     containerPort: 8080   # Update to your container port
   readinessProbe:
     tcpSocket:
       port: 8080          # Update probe port
   livenessProbe:
     tcpSocket:
       port: 8080          # Update probe port
   ```

2. **[k8s/service.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/service.yaml)**:
   ```yaml
   ports:
     - name: http
       protocol: TCP
       port: 80            # External public port (keep 80)
       targetPort: 8080    # Update to match your container port
   ```

3. **[k8s/configmap.yaml](file:///home/kashifhm333/Desktop/openhack/k8s/configmap.yaml)**:
   ```yaml
   data:
     PORT: "8080"
   ```

---

### Step 5: Commit and Trigger the GitOps Pipeline

Once your code, `Dockerfile`, and manifest configurations are aligned, push your changes to GitHub:

```bash
git add .
git commit -m "feat: integrate web application and enable automated deployment pipeline"
git push origin main
```

Watch the pipeline execute under the **Actions** tab of your GitHub repository:
1. Azure credentials verified.
2. ACR login completed.
3. Multi-stage Docker image built with BuildKit and pushed to ACR with SHA tag and `latest`.
4. AKS credentials fetched.
5. `production` namespace validated.
6. Manifests applied (`kubectl apply -f k8s/`).
7. Zero-downtime rolling restart performed.

---

### Step 6: Post-Deployment Verification

Verify the rollout directly from your terminal:

```bash
# 1. Connect local kubectl to the cluster
az aks get-credentials --resource-group rg-prod-k8s --name aks-prod-cluster --overwrite-existing

# 2. Check running pods in the production namespace
kubectl get pods -n production -o wide

# 3. Retrieve the External LoadBalancer Public IP
kubectl get svc my-webapp-service -n production

# Output example:
# NAME                TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)        AGE
# my-webapp-service   LoadBalancer   10.0.120.45    20.84.150.12     80:31245/TCP   5m

# 4. Test the public endpoint
curl -i http://<EXTERNAL-IP>/
```

---

## 5. Repository Structure

```
openhack/
├── .github/
│   └── workflows/
│       └── deploy.yaml         # Production GitHub Actions CI/CD Pipeline
├── k8s/
│   ├── configmap.yaml          # Externalized Application Configuration
│   ├── deployment.yaml         # High-Availability Deployment (Replicas, Probes, QoS)
│   ├── service.yaml            # Azure LoadBalancer Ingress Service
│   ├── hpa.yaml                # Horizontal Pod Autoscaler (2-5 pods)
│   └── pdb.yaml                # Pod Disruption Budget (minAvailable: 1)
├── terraform/
│   ├── main.tf                 # Root Module & Role Assignments
│   ├── variables.tf            # Global Variables & Defaults
│   ├── outputs.tf              # Infrastructure Connection Endpoints
│   ├── terraform.tfvars        # Active Environment Variable Overrides
│   └── modules/
│       ├── resource_group/     # Azure Resource Group Module
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── acr/                # Azure Container Registry Module
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       └── aks/                # Azure Kubernetes Service Module
│           ├── main.tf
│           ├── variables.tf
│           └── outputs.tf
└── README.md                   # Platform Architecture & Operations Manual
```

---

## 6. Troubleshooting & Operational Runbook

### Issue: `ImagePullBackOff` or `ErrImagePull`
- **Cause**: AKS Kubelet Managed Identity lacks pull rights on the ACR, or the image tag is incorrect.
- **Fix**: Verify role assignment in Azure:
  ```bash
  az role assignment list \
    --assignee $(az aks show -g rg-prod-k8s -n aks-prod-cluster --query identityProfile.kubeletidentity.objectId -o tsv) \
    --role "AcrPull" \
    --all
  ```
  If missing, re-run `terraform apply` to ensure `azurerm_role_assignment.aks_acr_pull` is applied.

### Issue: Pods stuck in `CrashLoopBackOff`
- **Cause**: Application failed health check probe, unhandled exception during startup, or non-root permissions conflict.
- **Fix**: Inspect pod logs:
  ```bash
  kubectl logs -l app=my-webapp -n production --tail=100
  kubectl describe pod -l app=my-webapp -n production
  ```

### Issue: LoadBalancer Public IP shows `<pending>`
- **Cause**: Azure Network Resource Provider is provisioning the Public IP and Azure Standard Load Balancer frontend rule (takes ~1-3 minutes).
- **Fix**: Wait 2 minutes and inspect the Service events:
  ```bash
  kubectl describe service my-webapp-service -n production
  ```

---

**Crafted with precision for resilient, cost-effective, and scalable cloud engineering.**
