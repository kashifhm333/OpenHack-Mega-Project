terraform {
  required_version = ">= 1.3.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

module "rg" {
  source   = "./modules/resource_group"
  rg_name  = var.rg_name
  location = var.location
}

module "acr" {
  source              = "./modules/acr"
  acr_name            = var.acr_name
  resource_group_name = module.rg.name
  location            = module.rg.location
}

module "aks" {
  source              = "./modules/aks"
  cluster_name        = var.cluster_name
  resource_group_name = module.rg.name
  location            = module.rg.location
  dns_prefix          = var.dns_prefix
  vm_size             = var.vm_size
  node_count          = var.node_count
}

resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = module.aks.kubelet_identity_object_id
  role_definition_name             = "AcrPull"
  scope                            = module.acr.id
  skip_service_principal_aad_check = true
}
