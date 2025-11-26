# Docker Commands Reference Guide

## Using Docker Compose (Recommended)

### Quick Start
```bash
./docker-compose-up.sh
```
This will:
- Load environment variables from `.env.local`
- Build the Docker image with the latest code
- Start the container in detached mode
- Display the application URL and useful commands

### Stop the Application
```bash
./docker-compose-down.sh
```
or
```bash
docker-compose down
```

### View Logs
```bash
# View all logs (follow mode)
docker-compose logs -f

# View only app logs
docker-compose logs -f app

# View last 50 lines
docker-compose logs --tail 50 app
```

### Restart After Code Changes
```bash
# Rebuild and restart (full rebuild)
docker-compose up --build -d

# Or just restart without rebuilding
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

---

## Using Docker Directly (Alternative)

### Build the Image
```bash
./build-docker.sh
```
or manually:
```bash
# Load environment variables
set -a
source .env.local
set +a

# Build
docker build --no-cache \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  -t resumegen-app .
```

### Run the Container
```bash
./run-docker.sh
```
or manually:
```bash
# Load environment variables
set -a
source .env.local
set +a

# Run
docker run -d --name resumegen-app -p 8000:8000 \
  -e CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  -e CLERK_JWKS_URL="$CLERK_JWKS_URL" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e XAI_API_KEY="$XAI_API_KEY" \
  -e HUGGINGFACE_API_KEY="$HUGGINGFACE_API_KEY" \
  resumegen-app
```

### View Logs
```bash
docker logs -f resumegen-app
```

### Stop and Remove
```bash
docker stop resumegen-app
docker rm resumegen-app
```

---

## Debugging Commands

### Check Environment Variables in Container
```bash
# Docker Compose
docker exec resumegen-app env | grep -E 'CLERK|OPENAI|XAI|HUGGING'

# Docker
docker exec resumegen-app env | grep -E 'CLERK|OPENAI|XAI|HUGGING'
```

### Check if Container is Running
```bash
# Docker Compose
docker-compose ps

# Docker
docker ps -a
```

### Access Container Shell
```bash
# Docker Compose
docker-compose exec app /bin/bash

# Docker
docker exec -it resumegen-app /bin/bash
```

### Test Health Check
```bash
curl http://localhost:8000/health
```

---

## Helper Scripts Available

| Script | Description |
|--------|-------------|
| `docker-compose-up.sh` | Start application with Docker Compose |
| `docker-compose-down.sh` | Stop application |
| `build-docker.sh` | Build Docker image directly |
| `run-docker.sh` | Run Docker container directly |
| `debug-build.sh` | Debug Docker build issues |

---

## Common Issues

### Issue: "Refreshing connection" stuck
**Cause:** Environment variables not loaded
**Fix:** Use the provided scripts (`docker-compose-up.sh` or `run-docker.sh`)

### Issue: 403 Forbidden errors
**Cause:** Empty CLERK environment variables
**Fix:** Ensure `.env.local` has all required variables and restart

### Issue: Cannot bind to port 8000
**Cause:** Port already in use
**Fix:** 
```bash
# Stop any existing containers
docker-compose down
docker stop resumegen-app 2>/dev/null
docker rm resumegen-app 2>/dev/null

# Find process using port 8000
lsof -i :8000
# Kill it if needed
kill -9 <PID>
```

### Issue: Docker build fails
**Cause:** Missing environment variables during build
**Fix:** Use `./build-docker.sh` which loads variables automatically

---

## Environment Variables Required

### Build-time (for Next.js)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Runtime (for FastAPI)
- `CLERK_SECRET_KEY`
- `CLERK_JWKS_URL`
- `OPENAI_API_KEY`
- `XAI_API_KEY` (optional)
- `HUGGINGFACE_API_KEY` (optional)

All should be in `.env.local` file.

---

## Quick Reference

**Start:** `./docker-compose-up.sh`  
**Stop:** `./docker-compose-down.sh`  
**Logs:** `docker-compose logs -f`  
**Rebuild:** `docker-compose up --build -d`  
**Status:** `docker-compose ps`  
**Application URL:** http://localhost:8000

