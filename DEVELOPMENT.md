# Development Guide

This guide explains how to develop locally with hot reloading (no Docker rebuilds needed).

## Quick Start - Local Development

### Prerequisites
- Node.js 22+
- Python 3.12+
- npm installed
- `.env.local` file with your environment variables

### Option 1: Automated Startup (Recommended)

Run both servers with a single command:

```bash
chmod +x run-dev.sh
./run-dev.sh
```

This will start:
- **FastAPI** on `http://localhost:8000` (with auto-reload)
- **Next.js** on `http://localhost:3000` (with hot reload)

Access your app at: **http://localhost:3000**

### Option 2: Manual Startup

**Terminal 1 - Start FastAPI Backend:**
```bash
# Load environment variables
source .env.local

# Start FastAPI with auto-reload
cd api
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Start Next.js Frontend:**
```bash
npm run dev
```

## How It Works

### Development Mode (Local)
- **Next.js** runs on port 3000 with hot module reloading
- **FastAPI** runs on port 8000 with `--reload` flag
- API calls to `/api/*` are proxied from 3000 → 8000 (via `next.config.ts`)
- **Changes are instant** - no rebuilds needed!

### Production Mode (Docker)
- **Next.js** builds static files to `/out` directory
- **FastAPI** serves both the static files AND API endpoints on port 8000
- Single container deployment
- Build command: `docker build -t app .`

## Making Changes

### Frontend Changes (`.tsx`, `.css` files)
1. Edit files in `pages/`, `styles/`, etc.
2. Save
3. Browser automatically refreshes
4. **No rebuild needed!**

### Backend Changes (`api/server.py`)
1. Edit `api/server.py`
2. Save
3. Uvicorn automatically reloads
4. **No rebuild needed!**

### Environment Variables (`.env.local`)
1. Edit `.env.local`
2. Restart servers (Ctrl+C and run `./run-dev.sh` again)

## Development Workflow

```
┌─────────────────────────────────────────────┐
│          DEVELOPMENT (Local)                │
│                                             │
│  Browser → localhost:3000 (Next.js)         │
│              ↓                              │
│         /api/* requests                     │
│              ↓                              │
│  Proxied → localhost:8000 (FastAPI)         │
│                                             │
│  ✅ Hot reload on all changes               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        PRODUCTION (Docker)                  │
│                                             │
│  Browser → localhost:8000 (FastAPI)         │
│              ↓                              │
│         Serves static files                 │
│         AND API endpoints                   │
│                                             │
│  ⚙️  Requires Docker rebuild for changes    │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Environment Variables Not Loading
Make sure `.env.local` exists and contains:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWKS_URL=https://....clerk.accounts.dev/.well-known/jwks.json
OPENAI_API_KEY=sk-proj-...
```

### API Calls Failing (403 or Connection Refused)
1. Check FastAPI is running on port 8000: `curl http://localhost:8000/health`
2. Check environment variables are loaded
3. Check Clerk keys are valid

### Changes Not Reflecting
- **Frontend**: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- **Backend**: Check terminal for errors, restart uvicorn if needed

## Testing Production Build Locally

When you want to test the Docker build:

```bash
# Build the image
source .env.local && docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  -t consultation-app .

# Run the container
docker run -p 8000:8000 --env-file .env.local consultation-app

# Access at http://localhost:8000
```

## Stop All Development Servers

If using `run-dev.sh`:
- Press `Ctrl+C` in the terminal

If running manually:
- Press `Ctrl+C` in each terminal window

## Best Practices

1. **Always develop locally** - Use Docker only for production testing
2. **Use `.env.local`** - Never commit this file (it's in `.gitignore`)
3. **Test Docker builds** before deploying
4. **Check both terminals** for errors when debugging
5. **Use FastAPI docs** at `http://localhost:8000/docs` for API testing
