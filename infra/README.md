# Infrastructure

This folder contains OpenTofu configuration to deploy the website infrastructure on Scaleway.

## Structure

```
infra/
├── backends/                  # Backend configuration per stage
│   ├── prod.tfbackend
│   ├── staging.tfbackend
│   └── dev.tfbackend
├── backend.tf                 # S3 backend configuration
├── main.tf                    # Main infrastructure resources
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── versions.tf                # Provider versions
└── terraform.tfvars.example   # Example variables file
```

## Usage

### Setup

Copy the example variables file and configure it for your stage:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
organization_id = "your-organization-id"
project_id      = "your-project-id"
stage           = "dev"  # Options: dev, staging, prod
```

### Initialize for a specific stage

Each stage uses its own state file in a separate S3 bucket. Initialize OpenTofu with the appropriate backend config:

```bash
# For prod
tofu init -backend-config=backends/prod.tfbackend

# For staging
tofu init -backend-config=backends/staging.tfbackend

# For dev
tofu init -backend-config=backends/dev.tfbackend
```

> **Note:** When switching between stages, you need to reinitialize with `-reconfigure`:
> ```bash
> tofu init -reconfigure -backend-config=backends/staging.tfbackend
> ```

### Plan changes

```bash
tofu plan
```

### Apply changes

```bash
tofu apply
```

### Destroy infrastructure

```bash
tofu destroy
```

## Configuring Backend Buckets

Each stage uses its own S3 bucket for storing OpenTofu state. Update the `bucket` value in the corresponding `backends/*.tfbackend` file:

```hcl
bucket = "your-bucket-name"
key    = "website.tfstate"
```

## Adding a New Stage

1. Create a new backend config file: `backends/<stage>.tfbackend`
2. Update your `terraform.tfvars` with the new stage value
3. Initialize with the new backend and apply
