output "domain" {
  description = "The domain of the website"
  value       = scaleway_object_bucket_website_configuration.website_bucket_website_configuration.website_domain
}

output "endpoint" {
  description = "The endpoint URL of the website"
  value       = scaleway_object_bucket_website_configuration.website_bucket_website_configuration.website_endpoint
}
