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




# Resume Gen Feature Implementation 

Resume Generator — Technical Documentation
Table of Contents
Feature Overview
System Architecture
User Workflow & State Machine
Data Flow: End-to-End
PDF & File Parsing Pipeline
Prompt Engineering
ATS Scoring System
SSE Streaming Architecture
Multi-Model Routing
Authentication & Security
DOCX Export
Observability: Logging & Analytics
Key Design Decisions & Tradeoffs
Known Failure Modes & Mitigations
Interview Talking Points
1. Feature Overview
The Resume Generator is the flagship feature of the SaaS platform. It takes a user's existing resume (PDF or image), an optional LinkedIn PDF export, an optional job description, and a target role, then produces an ATS-optimized resume in real time via streaming.

The feature is a two-phase, three-pass pipeline:

Phase	What happens	AI involved
A — Score original	User's uploaded resume is scored for ATS compatibility	GPT-4o-mini (JSON mode)
B — Generate	User reviews score, clicks generate; AI produces optimized resume	User-selected model, streamed
C — Re-score generated	Optimized output is automatically re-scored	GPT-4o-mini (JSON mode)
The UI shows a before/after ATS score delta (e.g., "+18 pts") making the improvement tangible and measurable.

2. System Architecture

┌──────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15, React 19)                                      │
│                                                                       │
│  pages/resume.tsx                                                     │
│  ┌─────────────────┐   ┌──────────────────────┐   ┌───────────────┐  │
│  │  ResumeForm     │   │  ATSScoreCard        │   │  DOCX Export  │  │
│  │  (state machine)│   │  (expandable widget) │   │  (client-side)│  │
│  └────────┬────────┘   └──────────────────────┘   └───────────────┘  │
│           │                                                           │
│   Phase A: POST /api/ats-score   (plain fetch, JSON response)         │
│   Phase B: POST /api/consultation (fetchEventSource, SSE stream)      │
│   Phase C: POST /api/ats-score   (plain fetch, triggered by useEffect)│
└──────────────────────────────────────────────────────────────────────┘
                              │  HTTP / SSE
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  FastAPI (api/server.py, Uvicorn)                                     │
│                                                                       │
│  POST /api/ats-score         ← sync def, runs in threadpool          │
│    └── parse_file_content()  ← hybrid PDF/OCR parser                 │
│    └── build_ats_score_prompt()                                       │
│    └── OpenAI gpt-4o-mini (json_object mode)                         │
│    └── returns structured JSON                                        │
│                                                                       │
│  POST /api/consultation      ← sync def, returns StreamingResponse   │
│    └── parse_file_content()  ← resume + linkedin PDFs                │
│    └── user_prompt_for()     ← assembles multi-section user prompt   │
│    └── model router          ← GPT-4o-mini / Groq / HuggingFace      │
│    └── event_stream()        ← generator, SSE newline-encoding hack  │
│    └── StreamingResponse(media_type="text/event-stream")             │
└──────────────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
             ┌─────▼─────┐       ┌──────▼──────┐
             │  OpenAI   │       │  DynamoDB   │
             │  API      │       │  Analytics  │
             └───────────┘       └─────────────┘
Key architectural constraint: The backend is a single-file FastAPI app (api/server.py). No routers, no service layer. All business logic lives inline.

3. User Workflow & State Machine
The frontend drives a WorkflowStep state machine defined in pages/resume.tsx:26:


'form'  ──[submit + resume uploaded]──►  'scoring'
                                             │
                               (ATS score API returns)
                                             ▼
                                         'scored'   ◄── user reviews score
                                             │
                               (user clicks "Generate")
                                             ▼
                                        'generating'  ◄── SSE streaming
                                             │
                               (SSE connection closes)
                                             ▼
                                        'complete'   ──► Phase C re-score triggers
State transitions are one-way. Each state controls what the UI renders:

scoring: spinner with "Analyzing your resume..."
scored: ATS score card + "Generate Optimized Resume" CTA
generating: live markdown preview streaming in
complete: full resume + before/after ATS comparison
Why gate generation behind the score? It gives the user a concrete reason to trust the output — they can see the before/after delta after generation. It also avoids the expensive generation call unless the user explicitly proceeds.

4. Data Flow: End-to-End
Step 1 — File Ingestion (Browser)
The user uploads resume PDF (required) and LinkedIn PDF (optional) via drag-and-drop or file picker. Both files are read via the FileReader API and converted to base64 strings client-side (pages/resume.tsx:524-538):


reader.readAsDataURL(file);
// strips the "data:application/pdf;base64," prefix
const base64 = reader.result.split(',')[1];
The base64 strings are stored in a formDataRef (not state) so they aren't lost across re-renders and don't trigger unnecessary re-renders themselves.

Step 2 — Phase A: Original ATS Scoring
handleSubmit fires a plain fetch POST to /api/ats-score with:

resume_pdf (base64)
resume_filename (for MIME detection)
linkedin_profile_pdf (optional base64)
job_description (optional string)
role_applied_for
The backend parses the PDF, runs GPT-4o-mini in json_object response mode, and returns a structured JSON score. The model is always forced to gpt-4o-mini for ATS scoring regardless of what the user selected — JSON mode is only reliable on OpenAI's models.

Step 3 — Phase B: Resume Generation (SSE)
User clicks "Generate." handleGenerate calls connectWithFreshToken(formDataRef.current) which opens an SSE connection to /api/consultation. The backend:

Re-parses both PDFs (they are re-sent in the same payload)
Builds a structured multi-section user prompt
Creates a streaming completion with the chosen model
Yields chunks as data: <text>\n\n events
The frontend buffers all chunks, scans for the ---AI_ENHANCEMENTS_START--- delimiter, and splits the buffer into resumeContent (rendered as markdown) and aiChanges (shown in a collapsible panel).

Step 4 — Phase C: Post-Generation Re-scoring
A useEffect watching workflowStep === 'complete' fires automatically (pages/resume.tsx:660-674). It calls /api/ats-score with resume_text (the generated markdown) instead of a PDF, triggering the same scoring pipeline without needing to re-parse a file. The before/after delta is then rendered in ATSScoreSummaryCompact.

5. PDF & File Parsing Pipeline
This is one of the most technically interesting parts of the feature. A single function parse_file_content() (api/server.py:297-339) handles a three-way decision tree:


Input: base64 file + filename
         │
         ▼
   Is extension an image?  (jpg, png, gif, webp, bmp, tiff)
         │
    Yes ─┼─►  extract_text_with_ocr()
         │      └── GPT-4o-mini Vision (direct base64 image upload)
    No   │
         ▼
   Try PyPDF2 text extraction
         │
   ≥200 chars extracted?
         │
    Yes ─┼─►  return PyPDF2 text  (fast path, free)
         │
    No   ▼
   extract_text_with_ocr()   (scanned PDF fallback)
      └── PyMuPDF renders each page to PNG at 2× zoom
      └── Each PNG sent to GPT-4o-mini Vision
      └── Returns text per page, joined with double newlines
The 200-character threshold is the heuristic that distinguishes a text-based PDF (where PyPDF2 extracts real content) from a scanned/image PDF (where PyPDF2 returns near-empty strings). This is calibrated from real-world resume PDFs — a meaningful resume page will always have more than 200 characters of extractable text.

OCR implementation detail: For scanned PDFs, PyMuPDF (fitz) renders each page at a 2× zoom matrix (fitz.Matrix(2, 2)) to produce a 144 DPI PNG. This zoom is critical — 72 DPI renders are often too blurry for GPT-4o-mini Vision to read accurately. The detail: "high" flag on the vision API call ensures OpenAI uses the full resolution tile-based analysis rather than the compressed 512px thumbnail.

6. Prompt Engineering
System Prompt Architecture
The system prompt (prompts/resume_generator_prompt.py) is structured with explicit priority hierarchies rather than loose instructions. Key structural choices:

Non-negotiable rules first: ATS compliance rules (single-column layout, no graphics, standard section headings, plain bullet characters) are labeled NON-NEGOTIABLE and placed at the top of the system prompt. LLMs tend to respect must/never/non-negotiable framing more reliably than soft suggestions.

Data priority order: The prompt explicitly defines a conflict-resolution hierarchy for when resume and LinkedIn disagree on contact info (LinkedIn > Resume > Form Input). This is necessary because LLMs have no natural way to resolve source conflicts without instruction.

Delimiter injection: The AI is instructed to produce a ---AI_ENHANCEMENTS_START--- delimiter mid-output to separate the resume from an editorial summary. This avoids needing a second API call to extract the AI's reasoning. The delimiter is deterministic ASCII so it can be reliably parsed client-side with buffer.indexOf().

Output format constraint: The prompt ends with The first character of your response must be '#'. This prevents the common failure mode where models prepend explanatory text before the markdown output, which would break the ATS score re-parsing.

User Prompt Construction
user_prompt_for() (api/server.py:347-400) dynamically assembles the user prompt by concatenating labeled blocks:


=== EXISTING RESUME CONTENT ===
<PyPDF2/OCR extracted text>
=== END OF EXISTING RESUME ===

=== LINKEDIN PROFILE CONTENT ===
(This is the user's LinkedIn PDF export - PRIMARY source for contact info)
<extracted text>
=== END OF LINKEDIN PROFILE ===

=== JOB DESCRIPTION (HIGH PRIORITY — tailor resume to match this) ===
<user-pasted JD>
=== END OF JOB DESCRIPTION ===
This labeled-block pattern is a standard technique for grounding LLMs when multiple heterogeneous sources are in context. The HIGH PRIORITY and CRITICAL labels in section headers are intentional prompt-engineering signals — they bias the model's attention toward those sections in long contexts.

ATS Scoring Prompt
The ATS scorer prompt (prompts/ats_scorer_prompt.py) is separately engineered for structured output reliability:

Starts with CRITICAL OUTPUT RULE: You MUST respond with ONLY a valid JSON object. The first character of your response must be '{' — this pre-empts markdown-wrapped JSON which would break json.loads()
Defines exact integer scoring rubrics (e.g., "25: All roles in reverse chronological order...") so the model has calibration anchors rather than subjective judgment
Uses response_format={"type": "json_object"} at the API level as a secondary enforcement mechanism
Defines a fixed enum of 6 valid type strings for red flags to prevent hallucinated flag types
7. ATS Scoring System
Scoring Rubric (max 100 points)
Category	Max	Key signals
Keyword Matching	30	JD keyword coverage % (skipped with 0/0 if no JD)
Work Experience	25	Action verbs, quantified metrics, reverse chrono, no gaps
Formatting	15	Single column, standard headings, no tables/graphics
Skills Section	10	Dedicated section, hard + soft skills, JD overlap
Contact Info	8	Name, phone, email, location, LinkedIn URL
Education	7	Degree, institution, graduation date, field
Length & Consistency	5	1–2 pages, date format uniformity, bullet style
Red Flag Penalties
Applied after summing category scores, floored at 0:

Flag	Penalty	Severity
job_hopping	–5 pts (max –10)	medium/high
employment_gap	–5 pts (max –10)	medium/high
missing_required_qualification	–3 pts (max –10)	high
keyword_stuffing	–5 pts	medium
no_contact_info	–10 pts	high
missing_keyword	0 (informational)	high/medium
No-JD Handling
When no job description is provided, keyword_matching.max is set to 0, which makes the category contribute 0/0 to the overall score. The scoring note is set to explain this exclusion. This is important for interview: this is not a hack — it's intentional design to avoid penalizing users who don't have a specific JD yet.

Backend Implementation
The /api/ats-score endpoint is a synchronous def (not async def). FastAPI automatically runs synchronous endpoints in a thread pool executor. This is intentional — the OpenAI SDK's blocking .create() call is not async-compatible with asyncio without an extra wrapper, and the thread pool approach avoids the complexity of asyncio.to_thread().

8. SSE Streaming Architecture
Why SSE Over WebSockets
SSE (Server-Sent Events) is a unidirectional HTTP/1.1-compatible protocol. For resume generation, the data flow is strictly server → client (the user submits a form, receives a stream). WebSockets add bidirectional complexity that isn't needed and would complicate the stateless JWT auth model.

The Newline-Encoding Hack
This is one of the most non-obvious implementation details. The backend splits each AI chunk by newlines and emits each line as a separate SSE event (api/server.py:689-693):


lines = text.split("\n")
for line in lines[:-1]:
    yield f"data: {line}\n\n"
    yield "data:  \n"          # space = blank line marker
yield f"data: {lines[-1]}\n\n"
Why: @microsoft/fetch-event-source dispatches one event per data: line (per SSE spec), not per chunk. If a raw chunk containing \n is emitted as a single data: event, the \n becomes a literal character in the event string. The client-side buffer += ev.data then never accumulates actual newlines.

The "data:  \n" (note the space before \n) serves as a blank-line marker. The frontend buffers these spaces and they're preserved as whitespace in the markdown output, which remark-breaks and remark-gfm convert back to proper line breaks during rendering.

Do not change this pattern without testing all three models — model outputs vary in how many \n characters they emit within a single streamed chunk.

Token Flow: JWT Expiry During Streaming
Clerk JWTs expire in ~60 seconds. For short prompts this is fine. For longer generations that exceed the token window, a 403 is returned. The onopen handler in fetchEventSource detects a 403 and triggers a single reconnect with a fresh getToken() call. There is no retry loop — reconnecting once is the deliberate limit. Further retries risk Clerk rate-limiting the session.

9. Multi-Model Routing
All three models use the OpenAI Python SDK but with different base_url and api_key configurations:

UI Label	SDK Config	Actual Model
gpt-4o-mini	OpenAI(api_key=OPENAI_API_KEY)	gpt-4o-mini
grok-beta	OpenAI(base_url="https://api.groq.com/openai/v1", api_key=XAI_API_KEY)	llama-3.3-70b-versatile
llama-70b	OpenAI(base_url="https://router.huggingface.co/v1", api_key=HUGGINGFACE_API_KEY)	meta-llama/Llama-3.1-70B-Instruct
The Groq and HuggingFace endpoints both expose an OpenAI-compatible /v1/chat/completions interface. This means the same SDK call, the same stream=True parameter, and the same chunk iteration pattern work across all three.

Tradeoff: Using the same SDK abstraction across models hides differences in context window sizes, rate limits, and output reliability. Llama models on HuggingFace sometimes wrap their output in markdown code fences. The frontend handles this with a stripCodeFences regex applied to the accumulated buffer on every event.

10. Authentication & Security
Clerk JWT Validation
Every API endpoint requires a Bearer token validated by fastapi-clerk-auth:


creds: HTTPAuthorizationCredentials = Depends(clerk_guard)
user_id = creds.decoded["sub"]   # always the first line after auth
The clerk_guard validates the JWT against the JWKS endpoint (CLERK_JWKS_URL). This is a standard RS256 public-key validation — the backend never has access to the user's password or session cookie, only a signed short-lived token.

File Upload Security
PDF inputs are base64-encoded by the client and sent in the JSON request body. The backend decodes base64 to bytes and pipes them into PyPDF2/PyMuPDF in-memory — no files are written to disk, no temp directories are created. This eliminates path traversal and file persistence risks.

The OCR path calls GPT-4o-mini Vision with user-controlled image data. There is no content filtering on the PDF before it's sent to the vision model. For a production hardening, adding a file size limit on the backend (len(file_bytes) > MAX_SIZE) would be the first step.

11. DOCX Export
DOCX generation is fully client-side using the docx npm package, dynamically imported on click to avoid adding it to the initial bundle (pages/resume.tsx:682-683):


const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
The export parses the raw markdown string line-by-line and maps markdown syntax to docx primitives:

Markdown	DOCX primitive
# Name	Paragraph({ heading: HeadingLevel.HEADING_1 })
## Section	Paragraph({ heading: HeadingLevel.HEADING_2 })
- bullet	Paragraph({ bullet: { level: 0 } })
**bold**	TextRun({ bold: true })
*italic*	TextRun({ italics: true })
Inline bold/italic is handled by splitting each line on /(\\*\\*.*?\\*\\*|\\*.*?\\*|.*?)/g and constructing an array of TextRun objects. This is a naive markdown parser — it handles the common cases in AI-generated resumes but would not handle nested emphasis, links, or tables.

Why client-side? Avoids sending the full resume text back to the server for conversion. The user already has the markdown in their browser; generating DOCX there is instant and free.

12. Observability: Logging & Analytics
Structured JSON Logging
All backend logging uses python-json-logger with a correlation pattern. Every log entry includes user_id, endpoint, and model. Example log fields for a resume generation call:


{
  "event": "AI request received",
  "endpoint": "/api/consultation",
  "user_id": "user_abc123",
  "model": "gpt-4o-mini",
  "has_resume_pdf": true,
  "has_linkedin_pdf": false
}
The stream completion event logs response_chars which gives a proxy metric for output length/cost.

DynamoDB Analytics
Every AI call fires a _log_event_bg() — a background thread wrapper around log_event() that writes to DynamoDB. This is fire-and-forget; it does not block the response. Events tracked:

ai_call (request received, with model + inputs metadata)
ai_response (completion, with response length and ATS scores)
This creates a complete funnel: you can query DynamoDB to see drop-off between call and response (failed generations), model distribution, and ATS score distributions across the user base.

13. Key Design Decisions & Tradeoffs
Decision 1: Two-Phase Workflow (Score → Generate)
Considered alternative: Score and generate simultaneously (call both APIs in parallel on submit).

Why rejected: If the generation finishes first, the user gets an improved resume without context on why it's better. The sequential workflow creates a "checkpoint" moment where the user sees their original resume's weaknesses, then sees them fixed. This also prevents wasting a generation API call if the user decides not to proceed after seeing the score.

Decision 2: Hybrid PDF Parser (PyPDF2 + Vision OCR)
Considered alternative: Always use Vision OCR; it's more reliable.

Why rejected: OCR via GPT-4o-mini Vision costs ~0.5–2 cents per page in API calls and takes 2–5 seconds per page. For standard text-based PDFs (most resumes), PyPDF2 extracts text in milliseconds at zero cost. The hybrid approach uses the fast path by default and only escalates to OCR for scanned documents. The 200-character threshold is the empirical cutoff.

Decision 3: Delimiter-Based Output Splitting vs. Two API Calls
The AI produces both the resume and the AI changes summary in a single stream, separated by ---AI_ENHANCEMENTS_START---.

Considered alternative: A second API call to generate the changes summary after generation completes.

Why rejected: Adds latency, complexity, and cost. The delimiter approach works reliably because the system prompt instructs the model to use that exact string. It means the "AI Enhancements" panel can be populated progressively as the stream arrives, rather than waiting for a second call to complete.

Decision 4: ATS Scoring Always Uses GPT-4o-mini
Even when the user selects grok-beta or llama-70b, ATS scoring is pinned to GPT-4o-mini with response_format={"type": "json_object"}.

Why: Groq's Llama-3.3-70b and HuggingFace's Llama-3.1-70B do not support OpenAI's response_format JSON mode. Without enforced JSON mode, these models occasionally output natural language prose instead of valid JSON, which breaks json.loads(). Pinning ATS scoring to GPT-4o-mini ensures deterministic structured output.

Decision 5: SSE for Generation, Plain Fetch for Scoring
Scoring is a fast synchronous call (~2-3 seconds). SSE would add unnecessary connection overhead. Generation can take 30–90 seconds for long resumes. SSE provides progressive rendering so the user sees output incrementally rather than waiting for a blank screen.

14. Known Failure Modes & Mitigations
Rate Limiting: Clerk getToken() returns null
Cause: Multiple rapid getToken() calls (e.g., a reconnect loop) trigger Clerk's rate limiter. Once rate-limited, getToken() returns null for the entire session.

Mitigation in code: fetchEventSource onerror is set to throw (not swallow), which terminates the SSE connection. A single reconnect is attempted on 403. No retry loop.

User-facing recovery: Sign out → sign back in creates a fresh session with no rate-limit history.

Scanned PDF Extraction Quality
Cause: Some scanned PDFs have low DPI, unusual fonts, or mixed languages.

Mitigation: 2× zoom on PyMuPDF rendering, "detail": "high" on Vision API. Partial mitigation only — extremely low-quality scans may still produce garbled text.

Model Output Wrapping in Code Fences
Cause: Llama models sometimes wrap markdown output in ```markdown fences despite the system prompt instructing otherwise.

Mitigation: stripCodeFences regex on every SSE event: /^```[a-zA-Z]*\n?/ and /\n?```\s*$/. Applied to the full buffer, not individual lines.

ATS Re-scoring on Generated Resume
Potential issue: The generated resume is re-scored from its markdown text representation, not a PDF. Markdown scoring vs. PDF scoring may produce slightly different results for formatting-related categories.

Current status: Accepted tradeoff. The scoring note in the response acknowledges when scoring is done on text vs. PDF.

15. Interview Talking Points
For an AI Engineer
"Walk me through your prompt engineering approach."

The system prompt is structured as a rulebook, not a request. ATS compliance rules are labeled non-negotiable and placed at the top to front-load the model's attention. Data priority rules explicitly handle source conflicts so the model doesn't have to infer them. The delimiter trick (---AI_ENHANCEMENTS_START---) embeds editorial metadata directly in the generation stream — eliminating a second API call while giving users transparency into what the AI changed and why.

"How do you handle structured output reliability?"

For the ATS scorer, I use three layers: (1) a system prompt that starts with "The first character of your response must be {", (2) an explicit JSON schema in the prompt with exact field names and types, and (3) OpenAI's response_format={"type": "json_object"} as a hard enforcement layer. The scorer is always pinned to GPT-4o-mini because Llama models don't support JSON mode — this was a deliberate tradeoff over giving users model choice for that call.

"Tell me about your multi-model architecture."

All three AI providers (OpenAI, Groq, HuggingFace) expose OpenAI-compatible REST endpoints. The backend uses the OpenAI Python SDK with base_url overrides for non-OpenAI providers. This abstraction means the same streaming iteration code works across all three — but it hides provider-specific quirks like context limits, rate limits, and output format differences that need to be managed at the prompt and post-processing level.

"How does your PDF parsing pipeline work?"

It's a two-stage fallback: PyPDF2 first (fast, free, text-based PDFs), Vision OCR second (GPT-4o-mini, scanned PDFs and images). The fallback trigger is a 200-character text threshold — if PyPDF2 returns less than 200 characters, the PDF is almost certainly a scan. For OCR, I render PDFs to PNGs at 2× zoom via PyMuPDF before sending to GPT-4o-mini Vision — this addresses legibility issues at standard 72 DPI.

For an AI PM
"What does the user experience look like and why was it designed that way?"

The workflow is deliberately gated: upload → score → generate → re-score. Users see their original resume's ATS score before generating. After generation, they see a before/after delta (e.g., "52 → 71, +19 pts"). This serves two purposes: it makes the AI's value tangible and measurable, and it prevents users from feeling the AI generated something for no clear reason. The score creates the "problem framing" that the generation solves.

"How do you measure feature quality and impact?"

Every API call and response is logged to DynamoDB with model, inputs metadata, and ATS scores. This enables funnel analysis (call → response completion rate), model preference distribution, and ATS score distributions. The before/after delta is particularly valuable as a product quality signal — a median improvement of +15 pts indicates the generation is meaningfully better; near-zero delta would indicate the prompt needs work.

"What are the biggest product risks?"

Three: (1) ATS scoring accuracy — the scorer itself is an LLM, so it can be inconsistent across identical inputs. We mitigate this with a detailed rubric and strict JSON schema, but it's not deterministic. (2) LinkedIn PDF parsing quality — LinkedIn's PDF export format varies by account type, and heavily graphic LinkedIn profiles may OCR poorly. (3) Job description injection — users paste free-form JD text. If the JD is very long, it pushes the resume content toward the context window edge for smaller models, potentially degrading output quality. A JD character limit and truncation warning would be a future mitigation.

"How would you scale this feature?"

Current bottleneck: all PDF parsing and AI calls are synchronous in the request path. At high volume, the first optimization is moving PDF parsing to an async task queue (Celery + Redis) so the API returns a job ID immediately and the client polls or uses a WebSocket for results. Second optimization: caching parsed PDF text keyed on file hash so a user re-submitting the same resume PDF doesn't re-run OCR. Third: adding a rate limit per user per day on the generation endpoint to manage AI API costs.

All file references are relative to the project root at /saas/.
Backend: api/server.py | Frontend: pages/resume.tsx | Resume prompt: prompts/resume_generator_prompt.py | ATS prompt: prompts/ats_scorer_prompt.py