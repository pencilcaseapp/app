terraform {
  backend "s3" {
    # Configure via backend config file: terraform init -backend-config=backends/<stage>.tfbackend
    region                      = "fr-par"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    endpoints = {
      s3 = "https://s3.fr-par.scw.cloud"
    }
  }
}
