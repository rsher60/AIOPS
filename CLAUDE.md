# CLAUDE.md — AI Assistant Context for This Codebase

## Project Overview
Full-stack AI-powered career assistant SaaS. Features: resume generation, career roadmap, message rewriter, company research (deep agent + web search), and job application tracker. Frontend is Next.js static export; backend is FastAPI. Deployed via Docker on AWS App Runner.

---

## Architecture

```
saas/                          ← project root (all paths below are relative to here)
├── pages/                     ← Next.js Pages Router (frontend)
│   ├── _app.tsx               ← ClerkProvider wraps everything
│   ├── index.tsx              ← Landing page
│   ├── resume.tsx             ← Resume generator (SSE streaming)
│   ├── Roadmap.tsx            ← Career roadmap (SSE streaming)
│   ├── CompanyResearch.tsx    ← Company research (plain fetch, NOT SSE)
│   ├── MessageRewriter.tsx    ← Message rewriter (SSE streaming)
│   ├── ApplicationTracker.tsx ← Job application tracker (S3-backed)
│   └── api/convert-to-docx.ts← Next.js API route for DOCX export
├── api/
│   └── server.py              ← FastAPI backend (~1100 lines), single file
├── prompts/                   ← Python files containing system prompt strings
│   ├── resume_generator_prompt.py
│   ├── message_rewriter_prompt.py
│   └── company_research_prompt.py
├── styles/globals.css         ← Tailwind global styles + .markdown-content overrides
├── logger.py                  ← JSON structured logging with correlation IDs
├── analytics.py               ← DynamoDB fire-and-forget analytics
├── venv/                      ← Python virtualenv (Python 3.13)
├── docker-compose.yaml
├── Dockerfile
├── next.config.ts
├── requirements.txt
└── package.json
```

---

## Tech Stack

| Layer | Technology | Version/Notes |
|-------|-----------|---------------|
| Frontend framework | Next.js | 15.5.6, Pages Router, static export in prod |
| UI | React | 19.1.0 |
| Styling | TailwindCSS | v4 |
| Auth | Clerk | @clerk/nextjs ^6.35.1 |
| Markdown render | react-markdown | ^10.1.0 + remark-gfm + remark-breaks |
| SSE client | @microsoft/fetch-event-source | ^2.0.1 (resume/roadmap/message only) |
| DOCX export | docx | ^9.5.1 |
| Backend framework | FastAPI | latest |
| Backend server | Uvicorn | latest |
| Backend auth | fastapi-clerk-auth | validates Clerk JWTs |
| AI (primary) | OpenAI GPT-4o-mini | via openai SDK |
| AI (alt 1) | Groq Llama-3.3-70b | via OpenAI-compatible endpoint |
| AI (alt 2) | HuggingFace Llama-3.1-70B | via router.huggingface.co |
| Deep research | deepagents | 0.4.3 — `create_deep_agent(model, tools, system_prompt)` |
| LangChain wrapper | langchain-openai | ChatOpenAI |
| Web search | tavily | TavilyClient |
| PDF parsing | PyPDF2 | PdfReader |
| Storage | AWS S3 | Application tracking JSON blobs |
| Analytics | AWS DynamoDB | User event tracking |
| Logging | python-json-logger | JSON structured logs |

---

## Getting Started

### Frontend
```bash
cd saas/
npm install
npm run dev         # http://localhost:3000
```

### Backend
```bash
cd saas/
# Always use the project venv, NOT system Python
venv/bin/pip install -r requirements.txt
# Run with PYTHONPATH pointing to parent so `saas` package resolves
PYTHONPATH=.. venv/bin/uvicorn saas.api.server:app --host 0.0.0.0 --port 8000 --reload
```

### Full stack (both at once)
```bash
npm run dev:all     # runs ./run-dev.sh
```

### Docker
```bash
npm run build:docker    # builds image: consultation-app
npm run start:docker    # runs at http://localhost:8000
```

---

## Common Commands

```bash
npm run dev              # Next.js dev server (port 3000)
npm run dev:backend      # FastAPI dev server (port 8000)
npm run build            # Next.js static export → out/
npm run lint             # ESLint
PYTHONPATH=.. venv/bin/python -c "import saas.api.server; print('OK')"  # Verify server loads
```

---

## Environment Variables

Create `.env.local` in the `saas/` directory:

```bash
# Clerk (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWKS_URL=https://YOUR_CLERK_DOMAIN/.well-known/jwks.json

# AI Models (OpenAI required; others optional)
OPENAI_API_KEY=sk-proj-...
XAI_API_KEY=gsk_...          # Groq API key (model label is "grok-beta" in UI)
HUGGINGFACE_API_KEY=hf_...   # HuggingFace

# Web search (required for company research)
TAVILY_API_KEY=tvly_...

# AWS (required for Application Tracker + analytics)
DEFAULT_AWS_REGION=us-east-1
AWS_ACCOUNT_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=resumegenapp
DYNAMODB_TABLE_NAME=saas-user-analytics
```

---

## Development Conventions

### Frontend
- Each page is self-contained: one main component + one inner Form component
- Clerk auth: `const { getToken, isLoaded, isSignedIn } = useAuth()` in the form component
- All pages share the same side-panel navigation pattern (drawer component defined inline at top of each page file)
- Model selection always defaults to `gpt-4o-mini`; options are `gpt-4o-mini`, `grok-beta`, `llama-70b`
- Markdown output rendered with `<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>`
- DOCX export is implemented inline in each page using the `docx` library

### Backend
- All AI endpoints are in `api/server.py` — single file, no splitting
- Pydantic models for all request bodies, defined near the endpoint that uses them
- All endpoints require Clerk JWT: `creds: HTTPAuthorizationCredentials = Depends(clerk_guard)`
- `user_id = creds.decoded["sub"]` — always the first line after auth
- Log every request: `log_login_if_new(user_id)` + `log_event(...)` + `logger.info(...)`
- Multi-model pattern: if/elif blocks for `gpt-4o-mini` / `grok-beta` / `llama-70b`
- System prompts live in `prompts/` as Python string variables, imported at top of server.py

### Streaming vs Non-Streaming
- Resume, Roadmap, MessageRewriter: **SSE streaming** via `StreamingResponse` + `fetchEventSource`
- CompanyResearch: **plain JSON** (`return {"content": content}`) + plain `fetch()` — NOT SSE
- SSE format for streaming endpoints: `yield f"data: {line}\n\n"` + `yield "data:  \n"` for newlines

---

## Key Concepts / Domain Knowledge

### SSE Streaming Pattern
The streaming endpoints use a specific newline-encoding hack:
```python
lines = text.split("\n")
for line in lines[:-1]:
    yield f"data: {line}\n\n"
    yield "data:  \n"          # space = blank line marker
yield f"data: {lines[-1]}\n\n"
```
Frontend buffers: `buffer += ev.data` — `fetchEventSource` dispatches one event per `data:` line, NOT per SSE event boundary. Do NOT change this pattern without testing all 3 models.

### Company Research Architecture
Uses LangChain `deepagents` with Tavily web search. Agent is created per-request (not module-level). The `web_search` function and `tavily_client` are module-level. `research_instructions` is the system prompt. Returns full result as JSON (not streamed) because `agent.invoke()` is blocking — SSE would hold the connection idle for minutes triggering browser timeouts.

### Model Routing
UI label → backend model mapping:
- `gpt-4o-mini` → OpenAI `gpt-4o-mini`
- `grok-beta` → Groq endpoint (`api.groq.com/openai/v1`) with model `llama-3.3-70b-versatile`
- `llama-70b` → HuggingFace (`router.huggingface.co/v1`) with model `meta-llama/Llama-3.1-70B-Instruct`

### Clerk Auth Flow
Frontend calls `getToken()` from `useAuth()` → passes as `Authorization: Bearer <jwt>` header → backend validates via `fastapi_clerk_auth`. Token expires in ~60 seconds but only needs to be valid at request start (not throughout SSE connection).

---

## What NOT To Do

- **Do NOT run server with system Python/uvicorn.** System Python 3.12 (`/Library/Frameworks/Python.framework/Versions/3.12/bin/uvicorn`) has old package versions. Always use `venv/bin/uvicorn` or `PYTHONPATH=.. venv/bin/python`.
- **Do NOT add reconnect loops to `fetchEventSource`** — calling `getToken()` repeatedly triggers Clerk rate limiting, after which `getToken()` returns `null` for the entire session. If rate-limited, the user must sign out and sign back in.
- **Do NOT use SSE for company research** — `agent.invoke()` blocks for 2-5 minutes with no data. SSE idle connections get killed by browser/proxy. Use plain `fetch()` POST.
- **Do NOT create `create_deep_agent(...)` at module level** — `model` and `request` don't exist at import time. Always create inside the endpoint function.
- **Do NOT call `agent.invoke(...)` at module level** — it runs at server startup, blocking indefinitely.
- **Do NOT put `from deepagents import create_deep_agent` mid-file** — put all imports at the top.
- **Do NOT remove `remarkBreaks` from resume/roadmap/messageRewriter** — the SSE buffer has no newlines without it (everything renders as one block).
- **Do NOT add `'\n'` to `buffer += ev.data`** — `fetchEventSource` dispatches one line at a time; adding `'\n'` duplicates newlines and breaks rendering.
- **Do NOT use `signOut()` + `router.push('/sign-in')` programmatically** — there is no `/sign-in` page; this creates redirect loops and leaves `loading: true` stuck on the component.
- **Do NOT wrap `getToken()` in a retry loop** — each retry call may hit Clerk rate limits.
- **Do NOT commit the `out/` directory** — it's the static export build artifact.
- **Do NOT change the SSE newline-encoding pattern** in streaming endpoints — the `"data:  \n"` (space) pattern is intentional and required for cross-model compatibility.

---

## Testing
No automated test suite is configured. Manual testing only. To verify the server loads cleanly:
```bash
PYTHONPATH=.. venv/bin/python -c "import saas.api.server; print('Server module loaded OK')"
```

---

## Errors Encountered and How They Were Fixed

### 1. `create_deep_agent() got an unexpected keyword argument 'system_prompt'`
- **Cause**: System Python 3.12 had `deepagents==0.0.10` (old API used `instructions=`). Server was picked up by system `uvicorn` at `/Library/Frameworks/Python.framework/Versions/3.12/bin/uvicorn`, not the venv.
- **Fix**: Upgraded system Python's deepagents: `/Library/Frameworks/Python.framework/Versions/3.12/bin/pip3 install --upgrade deepagents`
- **Prevention**: Always run server via `venv/bin/uvicorn`, not bare `uvicorn`.

### 2. `ModuleNotFoundError: No module named 'deepagents'` / `'dotenv'` / `'PyPDF2'`
- **Cause**: Packages listed in `requirements.txt` were not installed in the venv. The venv at `saas/venv/` was missing many packages.
- **Fix**: `cd saas && venv/bin/pip install -r requirements.txt`
- **Note**: The venv uses Python 3.13. System Python is 3.12. They are separate environments.

### 3. `ModuleNotFoundError: No module named 'saas'` when running server
- **Cause**: Running `venv/bin/python -c "import saas.api.server"` from inside the `saas/` directory doesn't resolve the `saas` package.
- **Fix**: Run with `PYTHONPATH=..` from the `saas/` directory, OR run from the parent directory.
- **Correct command**: `cd saas && PYTHONPATH=.. venv/bin/python -c "import saas.api.server"`

### 4. Clerk `getToken()` returning `null` — "Authentication required" / "Could not retrieve auth token"
- **Cause**: A `fetchEventSource` reconnect loop called `getToken()` dozens of times per minute, triggering Clerk's rate limit. After rate limiting, `getToken()` returns `null` for the entire session.
- **Fix (code)**: Removed all reconnect loops from `fetchEventSource`. Use `throw err` in `onerror` to stop retries.
- **Fix (user)**: Sign out via UserButton → sign back in. Creates a fresh session with no rate-limit history.
- **Prevention**: Never call `getToken()` in a loop. One call per user action max.

### 5. Deep agent code crashing server at startup
- **Cause**: User-added code placed `create_deep_agent(model=model, ...)` and `deepagent.invoke(...)` at module level. `model` and `request` are undefined at import time.
- **Fix**: Moved all agent creation inside the endpoint function. Module level only has: `tavily_client`, `web_search()`, `research_instructions`.

### 6. SSE connection timing out for company research (2-5 min agent run)
- **Cause**: `agent.invoke()` blocks for minutes with no data sent. Browser/proxy kills idle SSE connections after ~60-90s. `fetchEventSource` then auto-reconnects with expired token → 403 → reconnect loop → Clerk rate limit.
- **Fix**: Switched company research from SSE to plain `fetch()` POST returning JSON. Backend is a synchronous `def` endpoint so FastAPI runs it in threadpool automatically.

### 7. Entire resume rendered as one giant H1
- **Cause**: Changed SSE `event_stream` to emit one `data:` line per `\n` AND removed `remarkBreaks`. `fetchEventSource` dispatches per `data:` line, so `buffer` had no newlines. Everything starting with `#` was one giant H1.
- **Fix**: Reverted both changes. Keep original SSE format AND keep `remarkBreaks`.

### 8. GPT-4o-mini / Grok showing raw markdown (code fences not stripped)
- **Cause**: Some models wrap output in `` ```markdown `` fences or add preamble text before the fence, breaking the `^`-anchored regex.
- **Status**: Reverted to original state at user request. `stripCodeFences` regex: `/^```[a-zA-Z]*\n?/` and `/\n?```\s*$/`.

### 9. `company_research_system_prompt` imported but never used
- **Cause**: After switching to deep agent with `research_instructions`, the old prompt import became unused.
- **Status**: Harmless Pylance warning. Import left in for reference.

---

## External Services Summary

| Service | Purpose | Key Config |
|---------|---------|-----------|
| Clerk | User auth (JWT) | `CLERK_JWKS_URL` for backend validation |
| OpenAI | Primary AI model | `OPENAI_API_KEY` |
| Groq | Alt AI (Llama) | `XAI_API_KEY`, endpoint: `api.groq.com/openai/v1` |
| HuggingFace | Alt AI (Llama) | `HUGGINGFACE_API_KEY`, endpoint: `router.huggingface.co/v1` |
| Tavily | Web search for company research | `TAVILY_API_KEY` |
| AWS S3 | Application tracker storage | `S3_BUCKET_NAME=resumegenapp` |
| AWS DynamoDB | Analytics events | `DYNAMODB_TABLE_NAME=saas-user-analytics` |
| AWS App Runner | Production hosting | `/health` endpoint returns `{"status": "healthy"}` |
