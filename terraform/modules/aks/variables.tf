variable "cluster_name" {
  description = "The name of the AKS cluster"
  type        = string
}

variable "location" {
  description = "The Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
}

variable "dns_prefix" {
  description = "DNS prefix specified when creating the managed cluster"
  type        = string
}

variable "node_count" {
  description = "The initial number of nodes in the default node pool"
  type        = number
  default     = 1
}

variable "vm_size" {
  description = "The VM size for the default node pool"
  type        = string
  default     = "Standard_B2s"
}

variable "environment" {
  description = "Environment tag value"
  type        = string
  default     = "Production"
}
