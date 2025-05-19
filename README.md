# Alex Website

This repository contains the source code for Alex's personal website.

## Deployment

The website is automatically deployed to a Kubernetes cluster using GitHub Actions and ArgoCD. The deployment process is as follows:

1. When code is pushed to the `main` branch, a GitHub Actions workflow is triggered.
2. The workflow builds a Docker image and pushes it to GitHub Container Registry with two tags:
   - `latest`
   - `sha-{SHORT_SHA}` (e.g., `sha-a1b2c3d`)
3. The workflow then updates the Kubernetes manifests in the `anorum/homelab` repository (specifically in the `alex-website` directory) to use the new image tag.
4. ArgoCD detects the changes in the `anorum/homelab` repository and automatically syncs the changes to the Kubernetes cluster.

### Required Secrets

To enable the GitHub Actions workflow to update the Kubernetes manifests in the `anorum/homelab` repository, you need to add the following secret to this repository:

- `K8S_REPO_PAT`: A GitHub Personal Access Token with `repo` scope to allow the workflow to push changes to the `anorum/homelab` repository.

### Creating a Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Create a new token with access to the `anorum/homelab` repository
3. Grant it "Contents" permissions (read and write)
4. Add this token as a secret named `K8S_REPO_PAT` in your alex-website repository settings

## Local Development

To run the website locally:

```bash
npm install
npm run dev
```

## Docker Build

To build the Docker image locally:

```bash
docker build -t alex-website .
```

To run the Docker image locally:

```bash
docker run -p 4321:4321 alex-website
```
