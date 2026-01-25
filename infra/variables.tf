variable "organization_id" {
  type        = string
  description = "Scaleway organization ID"
}

variable "project_id" {
  type        = string
  description = "Scaleway project ID"
}

variable "stage" {
  description = "Stage where it will be deployed"
  type        = string
}

variable "bucket_name_suffix" {
  description = "Suffix to append to the bucket name to ensure uniqueness"
  type        = string
  default     = ""
}
