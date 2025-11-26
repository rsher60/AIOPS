
#!/bin/bash

# Docker Build Script with Environment Variables
# This script loads .env.local and builds the Docker image

set -e  # Exit on error

echo "🚀 Building Docker Image for Resume Generator"
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your environment variables"
    exit 1
fi

echo "📦 Loading environment variables from .env.local..."
set -a
source .env.local
set +a

# Verify required variables
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set in .env.local"
    exit 1
fi

echo "✓ Environment variables loaded"
echo ""

# Build Docker image
echo "🔨 Building Docker image..."
docker build --no-cache \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  -t resumegen-app .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "To run the container, use:"
    echo "docker run -p 8000:8000 \\"
    echo "  -e CLERK_SECRET_KEY=\"\$CLERK_SECRET_KEY\" \\"
    echo "  -e CLERK_JWKS_URL=\"\$CLERK_JWKS_URL\" \\"
    echo "  -e OPENAI_API_KEY=\"\$OPENAI_API_KEY\" \\"
    echo "  resumegen-app"
else
    echo ""
    echo "❌ Docker build failed"
    exit 1
fi
