# Architecture & Design Patterns Reference

> Prepared for technical interviews. Covers every pattern present in the codebase — backend, frontend, AI, and infrastructure.

---

## 1. Architectural Patterns

### 1.1 Backend-for-Frontend (BFF)
**Where:** `api/server.py` — FastAPI serves both the REST API and the static Next.js export from the same process and origin.
**Why it matters:** Eliminates cross-origin complexity entirely. The static files are mounted as a last-resort catch-all (`app.mount("/", StaticFiles(...))`) so every `/api/*` route resolves before Next.js ever gets a chance to intercept it. One container, one port, zero CORS issues in production.

### 1.2 Static Site + API Hybrid
**Where:** `next.config.ts` (`output: 'export'`), `api/server.py` (StaticFiles mount).
**Why it matters:** Next.js compiles to pure HTML/CSS/JS with no Node.js runtime dependency. FastAPI serves these as static files, keeping the infra footprint minimal — a single Docker container on AWS App Runner handles everything.

### 1.3 Append-Only Event Log (Analytics)
**Where:** `analytics.py` — every `log_event` call writes an immutable record to DynamoDB with a composite key `{timestamp}#{uuid}`.
**Why it matters:** Events are never updated or deleted, only appended. This mirrors event sourcing principles: you can replay the full user journey, compute derived metrics at query time, and audit everything without losing historical state.

### 1.4 Twelve-Factor App
**Where:** Throughout.
**Why it matters:** Config comes exclusively from environment variables (no hardcoded secrets), logs go to stdout (CloudWatch collects them automatically from App Runner), processes are stateless, and the app is built as a single deployable artifact. This makes it trivially portable between local dev, Docker, and cloud.

---

## 2. Backend Design Patterns

### 2.1 Strategy Pattern
**Where:** Model routing in every AI endpoint — `if request.model == "gpt-4o-mini" / elif "grok-beta" / elif "llama-70b"`.
**Why it matters:** The Strategy pattern encapsulates the "how to call an AI model" algorithm behind a uniform interface. Adding a fourth model requires adding one `elif` block — none of the surrounding logic changes. The `_resolve_chat_model()` helper applies the same pattern for LangChain-based clients.

### 2.2 Facade Pattern
**Where:** `parse_file_content(base64_file, filename)` in `api/server.py`.
**Why it matters:** Callers (all three AI endpoints) don't know whether they're getting PyPDF2 text extraction or GPT-4o-mini Vision OCR — they just call `parse_file_content()` and receive a string. The internal routing logic (image vs PDF, sparse text detection, fallback) is hidden behind a single clean interface.

### 2.3 Chain of Responsibility / Fallback Chain
**Where:** Inside `parse_file_content()` — PyPDF2 is attempted first; if the extracted text is sparse (<200 chars), OCR is invoked as a fallback. Also in `company_research` — deepagents for GPT-4o-mini, `_run_simple_research()` for Grok/Llama.
**Why it matters:** Each handler in the chain either processes the request or passes it to the next. This makes the degradation path explicit and testable without polluting the calling code with conditional logic.

### 2.4 Builder Pattern
**Where:** `user_prompt_for(request)` and `user_prompt_for_roadmap(request)` — both build prompts by appending to a `prompt_parts` list conditionally.
**Why it matters:** Prompt construction is inherently conditional (did the user upload a resume? a LinkedIn PDF? provide a job description?). The Builder pattern accumulates optional parts without creating a maze of nested if/else. The final `"\n".join(prompt_parts)` is the "build" step.

### 2.5 Fire-and-Forget / Async Background Task Pattern
**Where:** `_log_event_bg()` (analytics logging) and `run_agent()` inside `company_research` (research execution) — both spawned as daemon threads.
**Why it matters:** Work that doesn't affect the immediate response is moved off the request thread. Daemon threads mean they don't block server shutdown. This is the pragmatic alternative to full async machinery when the underlying code is synchronous.

### 2.6 Poll-for-Status Pattern
**Where:** `POST /api/company-research` returns `{"task_id": "..."}` immediately; `GET /api/research-status/{task_id}` is polled by the client every 5 seconds.
**Why it matters:** Company research runs for 2–5 minutes. SSE would time out on any proxy or browser. The poll-for-status pattern decouples submission from completion: the HTTP connection closes immediately, and the client checks in periodically. The `_research_tasks` dict acts as a lightweight in-process job registry.

### 2.7 Dependency Injection
**Where:** `Depends(clerk_guard)` in every authenticated FastAPI endpoint.
**Why it matters:** FastAPI resolves `clerk_guard` before the handler runs, validating the JWT and injecting the decoded credentials. Auth logic lives in exactly one place and cannot be accidentally bypassed — every endpoint that declares `Depends(clerk_guard)` is protected by default.

### 2.8 Middleware Pattern
**Where:** `request_logging_middleware` in `api/server.py`.
**Why it matters:** Cross-cutting concerns (correlation ID assignment, request/response logging, latency measurement) are applied to every request without touching individual endpoint handlers. Middleware runs in a stack — CORS middleware and logging middleware are independent and composable.

### 2.9 Correlation ID / Ambient Context Pattern
**Where:** `logger.py` — `ContextVar[str]` named `correlation_id_var`, set per request in the middleware, read by `CorrelationIdFilter` on every log record.
**Why it matters:** `ContextVar` is Python's thread-safe ambient context — it propagates a value through the call stack without passing it as a parameter. Every log line emitted during a request automatically carries the same `correlation_id`, making it trivial to reconstruct the full trace of a single request in CloudWatch.

### 2.10 Lazy Initialization / Singleton
**Where:** `_get_table()` in `analytics.py` — `_dynamodb_table` is `None` at import time and created on first call.
**Why it matters:** Creating a boto3 DynamoDB resource requires reading environment variables set by `load_dotenv()`. Lazy initialization ensures the resource is created after the environment is ready, not at import time. The singleton aspect prevents unnecessary client creation on subsequent calls.

### 2.11 In-Memory Cache
**Where:** `_user_cache: dict[str, dict]` and `_session_users: set[str]` in `analytics.py`.
**Why it matters:** The Clerk API call to fetch user info takes 50–200ms. Caching by `user_id` ensures it only happens once per server session per user. `_session_users` similarly deduplicates login events — without it, every API call would write a new login record to DynamoDB.

### 2.12 Adapter Pattern
**Where:** Using `OpenAI(base_url="https://api.groq.com/openai/v1", ...)` for Groq and `OpenAI(base_url="https://router.huggingface.co/v1", ...)` for HuggingFace.
**Why it matters:** Groq and HuggingFace expose OpenAI-compatible REST APIs. By using the `OpenAI` client as an adapter, we get the same `.chat.completions.create()` interface regardless of provider. Switching providers requires changing one URL and one model name string — nothing else.

### 2.13 Data Transfer Object (DTO)
**Where:** Pydantic models — `ResumeRequest`, `RoadmapRequest`, `MessageRewriteRequest`, `CompanyResearchRequest`, `ApplicationRequest`.
**Why it matters:** Pydantic validates, parses, and type-checks incoming JSON at the boundary of the system. Invalid requests fail with a 422 before touching any business logic. The DTO pattern keeps the request contract explicit and version-controlled in code rather than implicit in scattered `request.json()` calls.

### 2.14 Template Method Pattern
**Where:** The `event_stream()` generator function defined inside each streaming endpoint (`/api/consultation`, `/api/roadmap_consultation`, `/api/rewrite-message`).
**Why it matters:** Every streaming endpoint follows the same algorithm: start log → iterate chunks → accumulate buffer → yield SSE-formatted lines → end log → fire analytics. The structure is identical; only the prompt and model differ. This consistency makes each endpoint easy to reason about independently.

### 2.15 Repository Pattern
**Where:** S3 operations in the Application Tracker endpoints (`/api/applications` CRUD).
**Why it matters:** All S3 interaction (key construction, serialization, error handling) is co-located within the endpoint functions, abstracting the persistence concern away from what an "application" data object is. Each user's data is namespaced under `applications/{user_id}/` — a clean, predictable layout.

### 2.16 Structured Logging with Filter Decoration
**Where:** `logger.py` — `CorrelationIdFilter` is a logging `Filter` that decorates every `LogRecord` with the current correlation ID before formatting.
**Why it matters:** The JSON formatter emits machine-readable log lines that CloudWatch can index and query. Structured fields (`user_id`, `latency_ms`, `model`, `endpoint`) are queryable without regex parsing. The Filter pattern injects the correlation ID without modifying any logger call site.

---

## 3. AI-Specific Patterns

### 3.1 Agent Pattern
**Where:** `create_deep_agent(model, tools, system_prompt)` for company research with GPT-4o-mini.
**Why it matters:** An agent wraps a model in a loop that can call tools (Tavily web search), observe results, and decide the next action autonomously. This produces qualitatively better research than a single prompt because the model can issue follow-up queries based on what it finds — iterative refinement at inference time.

### 3.2 Retrieve-then-Synthesize (RAG-Adjacent)
**Where:** `_run_simple_research()` for Grok/Llama — runs 5 targeted Tavily queries, concatenates results as context, then calls the LLM to synthesize a report.
**Why it matters:** Pure LLM generation is bounded by training data and hallucinates on recent facts. Retrieval grounds the response in current web content. This is a lightweight RAG pattern: no vector database, no embeddings — just keyword search + context injection, sufficient for company research.

### 3.3 Prompt Template / Separation of Prompt and Code
**Where:** `prompts/resume_generator_prompt.py`, `prompts/message_rewriter_prompt.py`, `prompts/company_research_prompt.py`.
**Why it matters:** System prompts are long, complex, and change frequently. Keeping them in separate Python files means they can be iterated on without touching endpoint logic, reviewed as standalone artifacts, and imported cleanly. The `user_prompt_for()` builder constructs the dynamic user-turn separately, maintaining a clear system/user boundary.

### 3.4 Graceful Degradation
**Where:** `company_research` endpoint — deepagents for GPT-4o-mini; Grok/Llama fall back to `_run_simple_research()` because they emit XML tool syntax incompatible with deepagents' schema.
**Why it matters:** A capability gap in one model should never become a failure for the user. The degradation path still produces a high-quality report using a different execution strategy. All three model options produce a working result.

### 3.5 SSE Streaming Pattern with Newline Encoding
**Where:** `event_stream()` generators in three endpoints, consumed by `fetchEventSource` on the frontend.
**Why it matters:** LLM outputs are long (1,000–5,000 tokens). Streaming tokens as they arrive makes the UI feel instantaneous rather than blank for 10–30 seconds. The encoding pattern (`yield "data:  \n"` for blank lines) is a deliberate protocol-level hack: `fetchEventSource` dispatches one event per `data:` line, so markdown newlines must be re-encoded as a separate SSE event with a space to survive the boundary.

---

## 4. Frontend Patterns

### 4.1 Provider Pattern
**Where:** `ClerkProvider` wrapping `<Component />` in `_app.tsx`.
**Why it matters:** Injects Clerk auth state into the entire React tree without prop-drilling. Any component anywhere can call `useAuth()` and get the current user's token. The `Plus_Jakarta_Sans` font is similarly injected at the root via a CSS variable on the `<main>` wrapper.

### 4.2 Controlled Component Pattern
**Where:** Every form input in all feature pages — `value={state}` + `onChange={(e) => setState(e.target.value)}`.
**Why it matters:** React is the single source of truth for all form state. Validation is straightforward (inspect state before submit), derived UI is easy (disable button when required fields are empty), and component behavior is predictable and testable.

### 4.3 Conditional Rendering with Auth Guards
**Where:** `<SignedIn>` / `<SignedOut>` Clerk components throughout all pages.
**Why it matters:** Declarative auth guards — no imperative `if (user)` checks scattered through JSX. The rendering tree itself encodes the access rules. Components only populate after Clerk hydrates client-side, preventing auth flicker on the static export.

### 4.4 SSE Client with Buffer Accumulation
**Where:** `connectWithFreshToken()` in each form component — `fetchEventSource` accumulates `ev.data` into a `buffer` string, updating React state on each chunk.
**Why it matters:** SSE is unidirectional and HTTP-based, meaning it works through any proxy or CDN without special configuration. The accumulation pattern means React re-renders with progressively longer text, creating the typewriter streaming effect users see.

### 4.5 Hydration Guard / Mount Pattern
**Where:** `isMounted` state in `index.tsx` — floating particles only render after `useEffect` sets `isMounted = true`.
**Why it matters:** Next.js static export renders to HTML at build time. Components using `Math.random()` would produce different server vs client output, causing a React hydration mismatch error. The mount guard defers those renders until the client has taken over.

### 4.6 Optimistic / Progressive Rendering
**Where:** Resume, Roadmap, and MessageRewriter output panels — content appears token by token as the SSE stream arrives.
**Why it matters:** Users see output within 1–2 seconds of submission rather than waiting for full generation (10–30 seconds). This dramatically improves perceived performance and reduces the likelihood of users abandoning the page.

### 4.7 Inline Component Colocation
**Where:** `SidePanel` component defined at the top of each page file rather than extracted to a shared component.
**Why it matters:** Each page file is self-contained and independently deployable. No import coupling between pages that could cause bundle bloat. The trade-off is duplication, which is acceptable for a component this stable and infrequently changed.

---

## 5. Infrastructure & Deployment Patterns

### 5.1 Immutable Infrastructure with Tagged Images
**Where:** ECR deployment — each build produces a unique timestamped tag alongside `latest`.
**Why it matters:** Rollback is trivial — point App Runner at the previous tag. No in-place mutations, no environment drift. Each tag is a complete, reproducible snapshot of the application at a point in time.

### 5.2 Health Check Endpoint
**Where:** `GET /health` returning `{"status": "healthy"}` — explicitly excluded from request logging.
**Why it matters:** AWS App Runner polls this endpoint to determine container health. Excluding it from logging prevents CloudWatch noise. The endpoint is intentionally minimal — if the server can respond at all, it is healthy.

### 5.3 JWT Bearer Token Authentication
**Where:** Every authenticated endpoint via `Depends(clerk_guard)`.
**Why it matters:** Stateless authentication — the server holds no session state, validation is purely cryptographic (signature check + expiry). This makes horizontal scaling trivial and eliminates session storage as a bottleneck or failure point.

### 5.4 Separation of Concerns Across Modules
**Where:** `prompts/` (AI instructions), `analytics.py` (event tracking), `logger.py` (structured logging), `api/server.py` (HTTP layer).
**Why it matters:** Each module has exactly one responsibility and one reason to change. Updating a system prompt doesn't touch the HTTP layer. Adding an analytics field doesn't touch the logging infrastructure. This directly reduces the blast radius of any change.

---

## Pattern Summary Table

| Pattern | Category | Location |
|---|---|---|
| Backend-for-Frontend (BFF) | Architecture | server.py, next.config.ts |
| Append-Only Event Log | Architecture | analytics.py, DynamoDB |
| Twelve-Factor App | Architecture | Throughout |
| Strategy | Backend | server.py (model routing) |
| Facade | Backend | server.py (`parse_file_content`) |
| Chain of Responsibility | Backend | server.py (PDF → OCR fallback) |
| Builder | Backend | server.py (`user_prompt_for`) |
| Fire-and-Forget | Backend | server.py (`_log_event_bg`, `run_agent`) |
| Poll-for-Status | Backend | server.py (company research) |
| Dependency Injection | Backend | server.py (`Depends(clerk_guard)`) |
| Middleware | Backend | server.py (logging middleware) |
| Correlation ID / Ambient Context | Backend | logger.py (`ContextVar`) |
| Lazy Initialization / Singleton | Backend | analytics.py (`_get_table`) |
| In-Memory Cache | Backend | analytics.py (`_user_cache`) |
| Adapter | Backend | server.py (OpenAI client for Groq/HF) |
| Data Transfer Object (DTO) | Backend | server.py (Pydantic models) |
| Template Method | Backend | server.py (`event_stream` generators) |
| Repository | Backend | server.py (S3 for ApplicationTracker) |
| Structured Logging + Filter | Backend | logger.py |
| Agent | AI | server.py (`create_deep_agent`) |
| Retrieve-then-Synthesize | AI | server.py (`_run_simple_research`) |
| Prompt Template / Separation | AI | prompts/*.py |
| Graceful Degradation | AI | server.py (deepagents → simple fallback) |
| SSE Streaming with Encoding | AI + Frontend | server.py + all page components |
| Provider | Frontend | _app.tsx (ClerkProvider) |
| Controlled Component | Frontend | All form components |
| Auth Guard / Conditional Rendering | Frontend | All pages (SignedIn/SignedOut) |
| SSE Client + Buffer Accumulation | Frontend | All streaming pages |
| Hydration Guard | Frontend | index.tsx (`isMounted`) |
| Progressive Rendering | Frontend | All output panels |
| Inline Component Colocation | Frontend | All page files (SidePanel) |
| Immutable Infrastructure | Infra | ECR image tagging |
| Health Check Endpoint | Infra | server.py (`/health`) |
| JWT Bearer Auth | Infra | server.py + Clerk |
| Separation of Concerns | Infra | Module layout |
