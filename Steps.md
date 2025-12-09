Reverse Engineering Analysis: Resume Generator SaaS Application

  1. Initial Assessment

  Primary Technologies

  - Frontend: Next.js 15.5.6 with React 19, TypeScript, TailwindCSS 4
  - Backend: FastAPI (Python 3.12+)
  - Authentication: Clerk
  - AI Integration: OpenAI GPT-4, xAI Grok, Hugging Face Llama
  - Deployment: Docker with multi-stage builds
  - PDF Processing: PyPDF2

  Project Type

  Full-stack SaaS web application - Resume generation platform with AI-powered content creation

  Architecture Pattern

  Hybrid Architecture:
  - Development: Microservices (Frontend + Backend separate processes with API proxy)
  - Production: Monolithic deployment (Single Docker container serving static frontend + FastAPI backend)
  - Pattern: JAMstack-inspired with server-side API

  2. Project Structure Analysis

  resumegen-app/
  ├── pages/                      # Next.js Pages Router
  │   ├── _app.tsx               # Global app wrapper (Clerk provider)
  │   ├── _document.tsx          # HTML document structure
  │   ├── index.tsx              # Landing page with animations
  │   └── product.tsx            # Main resume generation interface
  │
  ├── api/                       # FastAPI backend
  │   ├── server.py             # Main API server with streaming
  │   └── __init__.py           # Python package marker
  │
  ├── styles/
  │   └── globals.css           # TailwindCSS + custom warm theme
  │
  ├── public/                   # Static assets
  │   ├── favicon.ico
  │   └── *.svg                # Next.js icons
  │
  ├── venv/                     # Python virtual environment
  │
  ├── Configuration Files:
  │   ├── package.json          # Node dependencies & scripts
  │   ├── requirements.txt      # Python dependencies
  │   ├── tsconfig.json         # TypeScript config
  │   ├── next.config.ts        # Next.js config (static export + dev proxy)
  │   ├── tailwind.config.ts    # TailwindCSS configuration
  │   ├── Dockerfile            # Multi-stage build
  │   ├── docker-compose.yaml   # Orchestration config
  │   ├── .env.local            # Environment variables
  │   └── .dockerignore         # Docker build exclusions
  │
  └── Helper Scripts:
      ├── build-docker.sh       # Build script with env loading
      ├── run-docker.sh         # Run script with env loading
      ├── docker-compose-up.sh  # Compose startup
      └── debug-build.sh        # Build debugging tool

  Key Configuration Files

  package.json - Defines:
  - Next.js 15 with React 19 (latest)
  - Clerk for authentication
  - React Markdown for rendering AI output
  - Custom scripts for dev/build/docker workflows

  next.config.ts - Critical dual-mode setup:
  - Production: Static export (output: "export")
  - Development: API proxy to FastAPI backend on port 8000
  - Image optimization disabled for static export compatibility

  Dockerfile - Multi-stage build:
  1. Stage 1: Node.js Alpine - Build Next.js static export
  2. Stage 2: Python slim - Run FastAPI + serve static files

  3. Development Sequence Reconstruction

  Based on file timestamps, dependencies, and architecture patterns:


  Phase 1: Project Bootstrap (Nov 14)

  Step 1: Next.js Project Initialization
  npx create-next-app@latest saas --typescript --tailwind --app-router
  - Created base Next.js 15 + TypeScript + TailwindCSS structure
  - Initial files: package.json, tsconfig.json, next.config.ts

  Step 2: Clerk Authentication Setup
  npm install @clerk/nextjs
  - Added Clerk provider in _app.tsx
  - Created .env.local with Clerk keys

  Phase 2: Core Application (Nov 16)

  Step 3: Landing Page Creation
  - Built pages/index.tsx with sign-in flow
  - Basic styling with TailwindCSS

  Step 4: Backend Foundation
  - Created api/server.py with FastAPI
  - Installed Python dependencies:
  python -m venv venv
  source venv/bin/activate
  pip install fastapi uvicorn openai fastapi-clerk-auth

  Step 5: Resume Generation Feature
  - Built pages/product.tsx with form interface
  - Implemented SSE (Server-Sent Events) streaming
  - Connected OpenAI GPT-4o-mini

  Phase 3: Multi-Model Support (Nov 19)

  Step 6: Added Multiple AI Providers
  - Integrated xAI Grok via OpenAI-compatible API
  - Added Hugging Face Llama 3.1 70B
  - Model selection dropdown in UI

  Step 7: Docker Configuration
  - Created Dockerfile with multi-stage build
  - Setup Next.js static export for production
  - Configured API proxy for development

  Step 8: Fixed Volume Mounting Issues
  - Resolved static file serving in Docker
  - Proper out/ directory mounting

  Phase 4: UI/UX Polish (Nov 22)

  Step 9: Design System
  - Implemented warm color theme (oranges, browns)
  - Created styles/globals.css with CSS variables
  - Dark mode support

  Step 10: Layout Improvements
  - Side-by-side form/output layout
  - Markdown rendering with react-markdown
  - Download resume functionality

  Phase 5: Advanced Features (Nov 25)

  Step 11: PDF Upload Feature
  - Added PDF file upload with drag-and-drop
  - Integrated PyPDF2 for text extraction
  - Base64 encoding for file transfer

  Step 12: Docker Automation
  - Created helper scripts (build-docker.sh, run-docker.sh)
  - Docker Compose configuration
  - Environment variable management

  Step 13: Dynamic Landing Page
  - Added typing animation
  - Animated statistics counter
  - Floating blobs and particles
  - Interactive hover effects
  - Mouse-following cursor glow

  4. Decision Points & Rationale

  Architecture Decisions

  Why Next.js Pages Router (not App Router)?
  - Simpler static export for Docker deployment
  - Easier API proxy configuration in development
  - Better compatibility with Clerk at time of development

  Why Static Export + FastAPI (not Next.js API Routes)?
  - Python ecosystem for AI/ML (OpenAI, Hugging Face)
  - Single Docker container deployment
  - Easier PDF processing with PyPDF2
  - FastAPI's native SSE support for streaming

  Why Server-Sent Events (not WebSockets)?
  - Simpler implementation for one-way streaming
  - Better compatibility with Docker/proxies
  - Native browser EventSource API
  - Automatic reconnection handling

  Why Multi-Stage Docker Build?
  - Smaller production image (Python slim vs full Node.js)
  - Separate build-time dependencies
  - Frontend assets built once, served by backend

  Why TailwindCSS 4?
  - Latest version with CSS-first configuration
  - Smaller bundle size
  - Inline theme support
  - Better dark mode handling

  Why Warm Color Scheme?
  - Professional resume context
  - Differentiation from typical blue SaaS apps
  - Accessibility (good contrast ratios)
  - Welcoming, human-centered design

  Technical Decisions

  Why PyPDF2 (not pdfplumber, PyMuPDF)?
  - Simpler API for text extraction
  - Lighter weight dependency
  - Sufficient for resume parsing

  Why Clerk (not NextAuth, Auth0)?
  - Best Next.js integration
  - Beautiful pre-built UI components
  - JWKS-based authentication (stateless)
  - User management dashboard

  Why Three AI Models?
  - Cost optimization (GPT-4o-mini for budget)
  - Uncensored options (xAI Grok)
  - Open-source alternative (Llama)
  - User choice and flexibility

  5. Step-by-Step Recreation Guide

  Prerequisites

  # Install Node.js 22+, Python 3.12+, Docker
  node --version  # v22+
  python3 --version  # 3.12+
  docker --version

  Step 1: Initialize Next.js Project

  npx create-next-app@latest resumegen-app \
    --typescript \
    --tailwind \
    --no-app \
    --src-dir=false \
    --import-alias="@/*"
  cd resumegen-app

  Step 2: Install Frontend Dependencies

  npm install @clerk/nextjs@^6.35.1 \
    @microsoft/fetch-event-source@^2.0.1 \
    react-datepicker@^8.9.0 \
    react-markdown@^10.1.0 \
    remark-gfm@^4.0.1 \
    remark-breaks@^4.0.0

  npm install -D @types/react-datepicker

  Step 3: Configure Next.js

  next.config.ts:
  import type { NextConfig } from "next";

  const isProd = process.env.NODE_ENV === 'production';

  const nextConfig: NextConfig = {
    ...(isProd && { output: "export" }),
    images: { unoptimized: true },
    ...(!isProd && {
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
        ];
      },
    }),
  };

  export default nextConfig;

  Step 4: Setup Clerk Authentication

  Create .env.local:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  CLERK_JWKS_URL=https://....clerk.accounts.dev/.well-known/jwks.json
  OPENAI_API_KEY=sk-proj-...
  XAI_API_KEY=gsk_...
  HUGGINGFACE_API_KEY=hf_...

  pages/_app.tsx:
  import { ClerkProvider } from '@clerk/nextjs';
  import type { AppProps } from 'next/app';
  import '../styles/globals.css';

  export default function App({ Component, pageProps }: AppProps) {
    return (
      <ClerkProvider>
        <Component {...pageProps} />
      </ClerkProvider>
    );
  }

  Step 5: Create Backend

  mkdir api
  python3 -m venv venv
  source venv/bin/activate

  requirements.txt:
  fastapi
  uvicorn
  openai
  fastapi-clerk-auth
  pydantic
  huggingface_hub
  python-dotenv
  PyPDF2

  pip install -r requirements.txt

  api/server.py - (Copy the complete server.py we have)

  Step 6: Create Landing Page

  pages/index.tsx - (Copy the animated index.tsx we created)

  Step 7: Create Product Page

  pages/product.tsx - (Copy the resume generation page)

  Step 8: Setup Styling

  styles/globals.css - (Copy the warm theme CSS)

  Step 9: Create Dockerfile

  Dockerfile:
  # Stage 1: Build Next.js
  FROM node:22-alpine AS frontend-builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ENV NODE_ENV=production
  RUN npm run build

  # Stage 2: Python runtime
  FROM python:3.12-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY api/server.py .
  COPY --from=frontend-builder /app/out ./static
  HEALTHCHECK --interval=30s --timeout=3s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
  EXPOSE 8000
  CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

  Step 10: Create Build Scripts

  build-docker.sh:
  #!/bin/bash
  set -e
  echo "🚀 Building Docker Image"
  set -a
  source .env.local
  set +a
  docker build --no-cache \
    --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
    -t resumegen-app .
  echo "✅ Build complete!"

  run-docker.sh:
  #!/bin/bash
  set -a
  source .env.local
  set +a
  docker run -d --name resumegen-app -p 8000:8000 \
    -e CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
    -e CLERK_JWKS_URL="$CLERK_JWKS_URL" \
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \
    -e XAI_API_KEY="$XAI_API_KEY" \
    -e HUGGINGFACE_API_KEY="$HUGGINGFACE_API_KEY" \
    resumegen-app

  chmod +x build-docker.sh run-docker.sh

  Step 11: Docker Compose (Optional)

  docker-compose.yaml:
  version: '3.8'
  services:
    app:
      build:
        context: .
        args:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      image: resumegen-app
      container_name: resumegen-app
      ports:
        - "8000:8000"
      env_file:
        - .env.local
      environment:
        - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
        - CLERK_JWKS_URL=${CLERK_JWKS_URL}
        - OPENAI_API_KEY=${OPENAI_API_KEY}

  Step 12: Development Workflow

  Add to package.json:
  {
    "scripts": {
      "dev": "next dev",
      "dev:backend": "cd api && python3 -m uvicorn server:app --reload --port 8000",
      "build": "next build",
      "start": "next start"
    }
  }

  Run in development:
  # Terminal 1
  npm run dev:backend

  # Terminal 2
  npm run dev

  Access at http://localhost:3000

  Step 13: Build and Deploy

  # Build
  ./build-docker.sh

  # Run
  ./run-docker.sh

  # Or use Docker Compose
  docker-compose up -d

  Access at http://localhost:8000

  6. Key Insights

  Strengths

  1. Elegant Development Experience: API proxy in dev, static export in prod
  2. Cost-Effective: Multiple AI model options, cheapest defaults
  3. Beautiful Animations: Professional, performant CSS animations
  4. Smart Streaming: Real-time AI responses with SSE
  5. Docker Optimization: Multi-stage build keeps image small (~200MB)
  6. Environment Management: Scripts handle env vars correctly
  7. PDF Processing: Extracts text from existing resumes to improve output

  Weaknesses & Improvements

  1. No Database: Sessions/history not persisted
    - Fix: Add PostgreSQL + Prisma for user resume history
  2. No Rate Limiting: API can be abused
    - Fix: Add rate limiting middleware in FastAPI
  3. No Error Boundaries: React crashes break entire app
    - Fix: Add Error Boundary components
  4. No Tests: Zero test coverage
    - Fix: Add Jest (frontend) + Pytest (backend)
  5. Hardcoded Base URL: API calls assume localhost
    - Fix: Environment variable for API_BASE_URL
  6. No Analytics: Can't track usage patterns
    - Fix: Add Posthog or Mixpanel
  7. No Resume Templates: Single output format
    - Fix: Add template selection (Modern, Classic, ATS-friendly)

  Unique Aspects

  1. Warm Color Palette: Unusual for SaaS, very distinctive
  2. Triple AI Provider: Most apps stick to one LLM
  3. Hybrid Development Model: Best of both worlds (hot reload + static export)
  4. Advanced Animations: Landing page rivals marketing sites
  5. PDF Resume Enhancement: Not just generation, but improvement

  What I'd Do Differently

  1. Add State Management: Redux or Zustand for complex state
  2. Implement Caching: Cache AI responses to reduce costs
  3. Add Resume Versioning: Let users iterate on drafts
  4. LinkedIn Integration: Import profile data automatically
  5. ATS Scoring: Show how resume scores with ATS systems
  6. Multi-Language Support: i18n for global users
  7. Mobile App: React Native version
  8. Webhook Notifications: Email resume when ready
  9. Collaborative Editing: Real-time collaboration
  10. Resume Analytics: Show which resumes get most interviews

  ---
  Quick Start Commands

  # Clone/create repository
  git clone <repo-url>
  cd resumegen-app

  # Install dependencies
  npm install
  python3 -m venv venv && source venv/bin/activate
  pip install -r requirements.txt

  # Setup environment
  cp .env.example .env.local
  # Edit .env.local with your API keys

  # Development
  npm run dev  # Terminal 1 (Frontend)
  npm run dev:backend  # Terminal 2 (Backend)

  # Production
  ./build-docker.sh
  ./run-docker.sh

  This codebase represents a well-architected modern SaaS application with excellent developer experience and
  production-ready deployment. The progression from simple landing page to full-featured AI app with multiple
  models and PDF processing shows thoughtful iterative development.
