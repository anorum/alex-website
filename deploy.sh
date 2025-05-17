#!/bin/bash
set -e

# Default values
IMAGE_NAME="alex-website"
GITHUB_USERNAME="anorum"
VERSION="latest"

# Display help message
function show_help {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -u, --username USERNAME   GitHub username (required)"
    echo "  -v, --version VERSION     Version tag for the image (default: latest)"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --username yourusername --version 1.0.0"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -u|--username)
            GITHUB_USERNAME="$2"
            shift
            shift
            ;;
        -v|--version)
            VERSION="$2"
            shift
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if GitHub username is provided
if [ -z "$GITHUB_USERNAME" ]; then
    echo "Error: GitHub username is required"
    show_help
    exit 1
fi

# Full image name with tag
FULL_IMAGE_NAME="ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$VERSION"

echo "===== Deploying $IMAGE_NAME to GitHub Container Registry ====="
echo "GitHub Username: $GITHUB_USERNAME"
echo "Image Version: $VERSION"
echo "Full Image Name: $FULL_IMAGE_NAME"

# Build the Docker image
echo -e "\n===== Building Docker image ====="
docker build -t $IMAGE_NAME:$VERSION .

# Tag the image for GitHub Container Registry
echo -e "\n===== Tagging image for GitHub Container Registry ====="
docker tag $IMAGE_NAME:$VERSION $FULL_IMAGE_NAME

# Note about authentication
echo -e "\n===== GitHub Container Registry Authentication ====="
echo "Note: You must be logged in to GitHub Container Registry to push images."
echo "If the push fails, please authenticate using one of these methods:"
echo "1. Using GitHub CLI: gh auth login && echo \$(gh auth token) | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin"
echo "2. Using a Personal Access Token: docker login ghcr.io -u $GITHUB_USERNAME"

# Push the image to GitHub Container Registry
echo -e "\n===== Pushing image to GitHub Container Registry ====="
docker push $FULL_IMAGE_NAME

echo -e "\n===== Deployment Complete ====="
echo "Image successfully pushed to GitHub Container Registry:"
echo "$FULL_IMAGE_NAME"
echo ""
echo "You can pull this image using:"
echo "docker pull $FULL_IMAGE_NAME"
