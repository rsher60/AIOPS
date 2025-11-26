
#!/bin/bash

# Docker Compose Up Script
# This script loads environment variables and runs docker-compose

set -e

echo "🚀 Starting Resume Generator with Docker Compose"
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
required_vars=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY" "CLERK_JWKS_URL" "OPENAI_API_KEY")
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

echo "✓ All required environment variables loaded"
echo ""

# Export variables for docker-compose
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
export CLERK_SECRET_KEY
export CLERK_JWKS_URL
export OPENAI_API_KEY
export XAI_API_KEY
export HUGGINGFACE_API_KEY

# Stop any running containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Build and start
echo ""
echo "🔨 Building and starting containers..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Application started successfully!"
    echo ""
    echo "📍 Application running at: http://localhost:8000"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:        docker-compose logs -f"
    echo "  - View app logs:    docker-compose logs -f app"
    echo "  - Stop:             docker-compose down"
    echo "  - Restart:          docker-compose restart"
    echo "  - Rebuild:          docker-compose up --build -d"
else
    echo ""
    echo "❌ Failed to start application"
    exit 1
fi
