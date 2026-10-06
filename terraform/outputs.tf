output "resource_group_name" {
  description = "Resource Group Name"
  value       = module.rg.name
}

output "acr_login_server" {
  description = "Azure Container Registry Login Server"
  value       = module.acr.login_server
}

output "aks_cluster_name" {
  description = "AKS Cluster Name"
  value       = module.aks.cluster_name
}

output "kube_config" {
  description = "Raw kubeconfig configuration string to connect to the cluster"
  value       = module.aks.kube_config
  sensitive   = true
}
