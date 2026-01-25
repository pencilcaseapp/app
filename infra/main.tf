provider "scaleway" {
  zone   = "fr-par-1"
  region = "fr-par"
}

locals {
  bucket_name = var.bucket_name_suffix != "" ? format("pencilcase-web-%s-%s", var.stage, var.bucket_name_suffix) : format("pencilcase-web-%s", var.stage)
}

resource "scaleway_object_bucket" "website_bucket" {
  name          = local.bucket_name
  project_id    = var.project_id
  force_destroy = true
}

resource "scaleway_object_bucket_policy" "main" {
  bucket = scaleway_object_bucket.website_bucket.id
  policy = jsonencode(
    {
      "Version" = "2012-10-17",
      "Statement" = [
        {
          "Effect"    = "Allow",
          "Principal" = "*",
          "Action" = [
            "s3:GetObject"
          ],
          "Resource" : [
            "${local.bucket_name}/*"
          ]
        }
      ]
  })
}

resource "scaleway_object_bucket_website_configuration" "website_bucket_website_configuration" {
  bucket = scaleway_object_bucket.website_bucket.name
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}
