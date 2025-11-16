#!/bin/bash

# Development startup script
# This runs both Next.js and FastAPI locally with hot reloading

set -e

echo "🚀 Starting development servers..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "❌ .env.local not found!"
    exit 1
fi

# Start FastAPI in background
echo "🐍 Starting FastAPI server on port 8000..."
cd api
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!
cd ..

# Wait a bit for FastAPI to start
sleep 2

# Start Next.js dev server
echo "⚛️  Starting Next.js dev server on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✨ Development servers running:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C and kill both processes
trap "echo ''; echo '🛑 Stopping servers...'; kill $FASTAPI_PID $NEXTJS_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
