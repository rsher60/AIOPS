#!/bin/bash

# Docker Compose Down Script

echo "🛑 Stopping Resume Generator..."
docker-compose down

if [ $? -eq 0 ]; then
    echo "✅ Application stopped successfully"
else
    echo "❌ Failed to stop application"
    exit 1
fi
