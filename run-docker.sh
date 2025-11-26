#!/bin/bash

# Docker Run Script
# This script loads environment variables and runs the Docker container

set -e

echo "🐳 Running Docker Container"
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    exit 1
fi

echo "📦 Loading environment variables from .env.local..."
set -a
source .env.local
set +a

# Verify required variables
required_vars=("CLERK_SECRET_KEY" "CLERK_JWKS_URL" "OPENAI_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✓ All required environment variables found"
echo ""

# Stop any existing container
echo "🛑 Stopping any existing resumegen-app container..."
docker stop resumegen-app 2>/dev/null || true
docker rm resumegen-app 2>/dev/null || true

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name resumegen-app \
  -p 8000:8000 \
  -e CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  -e CLERK_JWKS_URL="$CLERK_JWKS_URL" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  resumegen-app

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Container started successfully!"
    echo ""
    echo "📍 Application running at: http://localhost:8000"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:    docker logs -f resumegen-app"
    echo "  - Stop:         docker stop resumegen-app"
    echo "  - Remove:       docker rm resumegen-app"
else
    echo ""
    echo "❌ Failed to start container"
    exit 1
fi
