variable "rg_name" {
  description = "The name of the Resource Group"
  type        = string
  default     = "rg-prod-k8s"
}

variable "location" {
  description = "The Azure Region"
  type        = string
  default     = "East US"
}

variable "acr_name" {
  description = "The name of the Azure Container Registry (must be globally unique, alphanumeric)"
  type        = string
  default     = "acrprodminimal101"
}

variable "cluster_name" {
  description = "The name of the AKS cluster"
  type        = string
  default     = "aks-prod-cluster"
}

variable "dns_prefix" {
  description = "DNS prefix for AKS"
  type        = string
  default     = "aksprod"
}

variable "vm_size" {
  description = "VM size for the AKS default node pool"
  type        = string
  default     = "Standard_B2s"
}

variable "node_count" {
  description = "Worker node count for default node pool"
  type        = number
  default     = 1
}
