# Healthcare Consultation Assistant

AI-powered medical consultation notes summarizer with patient communication drafts.

## Quick Start

### Development (with hot reloading - no Docker rebuilds!)

**Option 1: One command (recommended)**
```bash
npm run dev:all
```

**Option 2: Manual setup**
```bash
# Terminal 1 - Backend
source .env.local
npm run dev:backend

# Terminal 2 - Frontend
npm run dev
```

Access at: **http://localhost:3000**

### Production (Docker)

**Build:**
```bash
source .env.local && npm run build:docker
```

**Run:**
```bash
npm run start:docker
```

Access at: **http://localhost:8000**

## Features

- 📋 Professional medical record summaries
- ✅ Clear next steps and action items
- 📧 Patient-friendly email drafts
- 🔒 Clerk authentication
- 🤖 OpenAI GPT integration
- ⚡ Real-time streaming responses

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: FastAPI, Python 3.12
- **Auth**: Clerk
- **AI**: OpenAI GPT
- **Deployment**: Docker

## Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://....clerk.accounts.dev/.well-known/jwks.json
OPENAI_API_KEY=sk-proj-...
```

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Complete development guide
- [Readme-edu.md](./Readme-edu.md) - Code flow documentation

## Project Structure

```
.
├── pages/              # Next.js pages (Pages Router)
│   ├── index.tsx      # Landing page
│   ├── product.tsx    # Consultation form
│   ├── _app.tsx       # App wrapper
│   └── _document.tsx  # HTML document
├── api/               # FastAPI backend
│   └── server.py      # Main API server
├── styles/            # Global styles
├── Dockerfile         # Multi-stage Docker build
├── next.config.ts     # Next.js configuration
└── .env.local         # Environment variables (gitignored)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only |
| `npm run dev:backend` | Start FastAPI dev server only |
| `npm run dev:all` | Start both servers (hot reload) |
| `npm run build` | Build Next.js for production |
| `npm run build:docker` | Build Docker image |
| `npm run start:docker` | Run Docker container |

## Development Workflow

1. **Make changes** to any `.tsx` or `.py` files
2. **Save** - changes automatically reload
3. **Test** at http://localhost:3000
4. **Build Docker** only when ready to deploy

No Docker rebuilds needed during development! 🎉

## License

Private
