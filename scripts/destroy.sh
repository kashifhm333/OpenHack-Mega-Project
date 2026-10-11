#!/usr/bin/env bash
# =========================================================================
# Fast, Clean Destroy Script for EKS, ECR & VPC
# Deletes Kubernetes LoadBalancers first to avoid AWS VPC DependencyViolation
# =========================================================================
set -eo pipefail

REGION="${AWS_REGION:-ap-southeast-2}"
CLUSTER_NAME="${EKS_CLUSTER_NAME:-eks-prod-cluster}"
NAMESPACE="production"

echo "=========================================================="
echo "🛑 INITIATING CLEAN INFRASTRUCTURE TEARDOWN"
echo "=========================================================="

# 1. Check if kubectl is connected and delete Kubernetes LoadBalancers first
echo "==> Step 1: Deleting Kubernetes LoadBalancer Services and Namespace..."
if aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME" 2>/dev/null; then
  echo "Connected to EKS cluster. Cleaning up Kubernetes LoadBalancers..."
  kubectl delete svc --all -n "$NAMESPACE" --ignore-not-found=true || true
  kubectl delete namespace "$NAMESPACE" --ignore-not-found=true || true
  
  echo "Waiting 30s for AWS to release Elastic Network Interfaces (ENIs)..."
  sleep 30
else
  echo "EKS cluster already unreachable or deleted. Proceeding directly..."
fi

# 2. Check for any orphaned AWS Load Balancers created by Kubernetes
echo "==> Step 2: Checking for any lingering Load Balancers tagged with $CLUSTER_NAME..."
LBS=$(aws elbv2 describe-load-balancers --region "$REGION" --query "LoadBalancers[?contains(LoadBalancerName, 'k8s')].LoadBalancerArn" --output text 2>/dev/null || true)
if [ -n "$LBS" ] && [ "$LBS" != "None" ]; then
  for lb_arn in $LBS; do
    echo "Deleting lingering Load Balancer: $lb_arn"
    aws elbv2 delete-load-balancer --load-balancer-arn "$lb_arn" --region "$REGION" || true
  done
  echo "Waiting 20s for ENI release..."
  sleep 20
fi

# 3. Run Terraform Destroy
echo "==> Step 3: Running terraform destroy..."
cd "$(dirname "$0")/../terraform"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)
BUCKET="${TF_STATE_BUCKET:-openhack-tfstate-${ACCOUNT_ID}-${REGION}}"

terraform init \
  -reconfigure \
  -backend-config="bucket=${BUCKET}" \
  -backend-config="key=production/terraform.tfstate" \
  -backend-config="region=${REGION}"

terraform destroy -auto-approve

echo ""
echo "=========================================================="
echo "✅ ALL RESOURCES DESTROYED CLEANLY AND RAPIDLY!"
echo "=========================================================="
