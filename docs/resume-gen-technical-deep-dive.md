# Resume Generator: Technical Deep Dive

**Audience:** Technical engineers, interviewers, system design reviewers  
**Format:** STAR (Situation → Task → Action → Result)  
**Files covered:**
- `pages/resume.tsx` — Next.js frontend
- `api/server.py` — FastAPI backend (lines 114–707)
- `prompts/resume_generator_prompt.py` — System prompt

---

## SITUATION

### The Problem Space

Generating a resume for a job application is deceptively complex. The output must simultaneously satisfy two audiences with opposing preferences:

1. **ATS parsers** (Applicant Tracking Systems) — algorithmic scanners that rank resumes by keyword density, section heading names, file format compliance, and absence of tables/columns/graphics.
2. **Human recruiters** — who want narrative, achievement quantification, and clean prose.

On top of that, a user arrives with up to four heterogeneous inputs — a resume PDF, a LinkedIn export PDF, a raw job description text blob, and freeform notes — that must be merged, reconciled, and weighted correctly before any LLM call is made.

Finally, the response can be thousands of tokens long (full resume + AI enhancements summary). Waiting for the full response before showing anything creates a poor UX. The output must be streamed in real time.

### System Context

- **Frontend:** Next.js 15 (Pages Router), static export in production
- **Backend:** FastAPI (single file: `api/server.py`), Python 3.13, running in the project's `venv/`
- **Auth:** Clerk (JWT validation via `fastapi-clerk-auth`)
- **AI:** OpenAI `gpt-4o-mini` (primary), Groq `llama-3.3-70b-versatile`, HuggingFace `meta-llama/Llama-3.1-70B-Instruct`
- **PDF parsing:** PyPDF2 for text-based PDFs; GPT-4o-mini Vision OCR (via PyMuPDF page rendering) as fallback for scanned PDFs
- **Deployment:** Docker on AWS App Runner

---

## TASK

Build an end-to-end resume generation pipeline with the following requirements:

1. Accept resume PDFs, LinkedIn PDFs, job descriptions, and freeform notes
2. Score the *original* resume for ATS compatibility before generation (so users see the before/after delta)
3. Parse uploaded files using a hybrid strategy (text extraction → vision OCR fallback)
4. Construct a well-structured prompt that faithfully represents all inputs with correct priority ordering
5. Stream the AI-generated resume token-by-token to the browser as it is produced
6. Split the streamed output into two parts: the resume itself and an AI Enhancements summary
7. Re-score the *generated* resume automatically to show the improvement delta
8. Allow export to `.docx` with inline markdown-to-Word conversion, client-side

---

## ACTION

### 1. Frontend State Machine

The form is not a single-shot submit. It is a 5-state machine that breaks the workflow into explicit phases, each with its own UI:

```
form → scoring → scored → generating → complete
```

Declared as:

```typescript
// pages/resume.tsx:26
type WorkflowStep = 'form' | 'scoring' | 'scored' | 'generating' | 'complete';
```

**State transitions:**

| Transition | Trigger | What happens |
|---|---|---|
| `form → scoring` | User clicks "Analyze & Score My Resume" (`handleSubmit`) | Files read to base64; ATS score API called on the *original* resume |
| `scoring → scored` | `/api/ats-score` returns | Score card shown; "Generate Optimized Resume" button revealed |
| `scored → generating` | User clicks "Generate" (`handleGenerate`) | SSE connection opened to `/api/consultation` |
| `generating → complete` | SSE `onclose` fires | ATS re-score of *generated* resume is triggered automatically |

The key architectural decision here: **the user sees the original score before committing to generation**. This is intentional — it gives users an informed choice and makes the before/after delta meaningful.

Form data (base64 file contents) is cached in `formDataRef.current` after Phase A so files are not re-read from disk in Phase B:

```typescript
// pages/resume.tsx:619
formDataRef.current = formData;
```

---

### 2. Hybrid File Parsing (Backend)

The file parsing layer lives in `api/server.py` and handles four file types: text PDFs, scanned PDFs, JPEG/PNG images, and LinkedIn PDF exports.

**Strategy:**

```
Input file
   │
   ├── Image extension? (.jpg, .png, etc.)
   │     └── OCR via GPT-4o-mini Vision (direct base64 upload)
   │
   └── PDF?
         ├── PyPDF2 text extraction
         │     ├── Extracted > 200 chars? → return text (fast path)
         │     └── Sparse/empty? → fallback to OCR
         └── OCR via GPT-4o-mini Vision (PyMuPDF renders each page to PNG at 2× zoom)
```

Implemented in `parse_file_content()` (server.py:297) which calls `extract_text_with_ocr()` (server.py:222) for the OCR path.

**Why the 200-char threshold?** PyPDF2 can successfully open a scanned PDF (no exception raised) but return empty or near-empty text per page. A 200-character minimum on the combined extracted text is a reliable signal that the PDF is actually text-based.

**Why PyMuPDF at 2× zoom?** Rendering at 1× produces ~72 DPI which causes the vision model to miss fine text, especially in condensed resume layouts. 2× (144 DPI) consistently yields accurate extraction.

---

### 3. Pydantic Request Model

```python
# api/server.py:114
class ResumeRequest(BaseModel):
    applicant_name: str
    application_date: str
    role_applied_for: str
    resume_pdf: str | None = None          # base64-encoded file
    linkedin_profile_pdf: str | None = None
    resume_filename: str | None = None     # used for OCR type detection
    linkedin_filename: str | None = None
    job_description: str | None = None
    additional_notes: str
    model: str                             # "gpt-4o-mini" | "grok-beta" | "llama-70b"
```

Files are transmitted as base64 strings inside the JSON body. This avoids `multipart/form-data` complexity in the SSE-compatible flow.

---

### 4. Prompt Construction (`user_prompt_for`)

The user prompt is assembled in `user_prompt_for()` (server.py:347) using an ordered list of blocks with explicit priority labels that the system prompt is trained to recognize:

```
1. Applicant name, date, role
2. [Optional] === EXISTING RESUME CONTENT === ... === END OF EXISTING RESUME ===
3. [Optional] === LINKEDIN PROFILE CONTENT === ... === END OF LINKEDIN PROFILE ===
   + IMPORTANT: prioritize LinkedIn for contact info
4. [Optional] === JOB DESCRIPTION (HIGH PRIORITY) === ... === END OF JOB DESCRIPTION ===
   + CRITICAL: mirror exact keywords, rewrite bullets to match responsibilities
5. Additional Instructions from Applicant
```

**Priority ordering rationale:**
- The job description block appears last among the content inputs, which places it closest to the model's generation point and gives it maximum recency weight in the context window — this is an intentional prompt engineering decision.
- LinkedIn is explicitly labeled as the primary source for contact information (email, phone, location) because users' LinkedIn profiles are more likely to have current professional contact details than an old resume PDF.

---

### 5. System Prompt Architecture

The system prompt (`prompts/resume_generator_prompt.py`) is ~215 lines and is structured as a formal specification document, not a conversational instruction. Key design decisions:

**ATS Compliance Rules (non-negotiable section)**
- Single-column layout, standard section headings, no tables, no graphics
- Plain hyphens for bullets (not ●, ★, ▶)
- Month Year date format consistency
- Output starts with `#` (no code fences) — enforced by: `"The first character of your response must be #"`

**Keyword Matching Section**
- When a JD is provided: mirror exact terminology verbatim, target 2–3 occurrences per JD-required keyword across summary + skills + experience
- When no JD: extract keywords from target job title and cross-validate against LinkedIn endorsements

**Delimiter Contract**
The system prompt requires the model to split its output at a specific delimiter:

```
---AI_ENHANCEMENTS_START---
```

Everything before the delimiter is the resume. Everything after is the AI Enhancements Summary (ATS compliance notes, keyword actions taken, red flags detected). This delimiter is parsed on the frontend to split the streamed buffer into two display panels.

---

### 6. Multi-Model Routing (Backend)

The endpoint routes to three different AI backends based on `request.model`:

```python
# api/server.py:598-666 (abbreviated)
if request.model == "gpt-4o-mini":
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    stream = client.chat.completions.create(model="gpt-4o-mini", ...)

elif request.model == "grok-beta":
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",   # Groq uses OpenAI-compatible API
        api_key=os.getenv("XAI_API_KEY"),
    )
    stream = client.chat.completions.create(model="llama-3.3-70b-versatile", ...)

elif request.model == "llama-70b":
    hf_client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=os.getenv("HUGGINGFACE_API_KEY"),
    )
    stream = hf_client.chat.completions.create(
        model="meta-llama/Llama-3.1-70B-Instruct",
        max_tokens=2048,    # HuggingFace requires explicit cap
        ...
    )
```

**Key architectural decision:** All three providers expose an OpenAI-compatible streaming API. The same `stream` variable is used downstream regardless of which branch executed. The `OpenAI` client SDK is repurposed for all three by swapping `base_url`. This means the `event_stream()` generator is provider-agnostic — no branching inside the stream consumer.

**UI label → actual model mapping:**

| UI Label | Backend Model | Provider |
|---|---|---|
| GPT-4o Mini | `gpt-4o-mini` | api.openai.com |
| Grok Beta | `llama-3.3-70b-versatile` | api.groq.com (Groq, not xAI) |
| Llama 3.1 70B | `meta-llama/Llama-3.1-70B-Instruct` | router.huggingface.co |

Note: The UI label "Grok Beta" is a historical artifact. The endpoint actually calls Groq's API (a different company) with a Llama model. The env var `XAI_API_KEY` holds a Groq key.

---

### 7. SSE Streaming Architecture

This is the most technically nuanced part of the system.

#### Backend: `event_stream()` Generator

```python
# api/server.py:681-705
def event_stream():
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            lines = text.split("\n")
            for line in lines[:-1]:
                yield f"data: {line}\n\n"
                yield "data:  \n"          # space = blank line sentinel
            yield f"data: {lines[-1]}\n\n"

return StreamingResponse(event_stream(), media_type="text/event-stream")
```

The `StreamingResponse` with `media_type="text/event-stream"` sets the correct `Content-Type` header and keeps the HTTP connection open, flushing each `yield` to the client immediately.

#### The Newline Encoding Hack

This is the most critical implementation detail. The SSE protocol uses `\n\n` to delimit events. If a `data:` value contains a literal `\n`, the browser's SSE parser interprets it as an event boundary, consuming it before `fetchEventSource` ever sees the data.

The solution: **encode newlines as separate `data:` events with a space payload**.

```
AI produces: "Hello\nWorld"

Naively:                        Correct:
data: Hello\nWorld\n\n          data: Hello\n\n
                                data:  \n        ← space = "was a newline here"
                                data: World\n\n
```

On the frontend, `fetchEventSource` dispatches one event per `data:` line. The buffer simply concatenates `ev.data` directly:

```typescript
// pages/resume.tsx:435
buffer += ev.data;
```

The `"data:  \n"` (space character) event appends a space to the buffer. But in Markdown, a lone space between lines is treated as a line break by `remarkBreaks`. This is why `remarkBreaks` is a non-negotiable plugin — without it, the space characters would have no visual effect and all content would render as one block.

**Do NOT** add `'\n'` in the `onmessage` handler. `fetchEventSource` fires once per `data:` event, not per SSE event boundary. Adding `'\n'` would double the newlines on lines that ended with `\n`.

---

### 8. ATS Scoring Endpoints (`/api/ats-score`)

The ATS scorer is a separate endpoint called twice per workflow:
- **Phase A**: Scores the original uploaded resume PDF
- **Phase C**: Scores the generated markdown resume text (after SSE completes)

Unlike the main generation endpoint, it is **not** streamed:
- Uses `response_format={"type": "json_object"}` to force structured JSON output
- Always uses `gpt-4o-mini` regardless of the user's model selection (the `model` field is accepted but ignored)
- Returns a typed JSON object with: `overall_score`, `score_label`, `categories` (breakdown by 7 dimensions), `red_flags`, `top_improvements`, `has_job_description`, `scoring_note`

The Phase C re-score takes `resume_text` (the generated markdown string) instead of `resume_pdf`, bypassing the PDF parser entirely.

```typescript
// pages/resume.tsx:661-674
useEffect(() => {
    if (workflowStep === 'complete' && resumeContent && !atsScoreGenerated) {
        setAtsLoading(true);
        callAtsScore({
            resume_text: resumeContent,    // generated markdown, not a PDF
            job_description: ...,
            role_applied_for: ...,
        })...
    }
}, [workflowStep, resumeContent]);
```

---

### 9. Delimiter-Based Output Splitting (Frontend)

The frontend buffer is scanned on every `onmessage` event for the delimiter:

```typescript
// pages/resume.tsx:446-460
const delimiterIndex = buffer.indexOf('---AI_ENHANCEMENTS_START---');

if (delimiterIndex !== -1) {
    const resume = stripCodeFences(buffer.substring(0, delimiterIndex).trim());
    const changes = stripCodeFences(
        buffer.substring(delimiterIndex + '---AI_ENHANCEMENTS_START---'.length).trim()
    );
    setResumeContent(resume);
    setAiChanges(changes);
    setShowAiChanges(true);
} else {
    setResumeContent(stripCodeFences(buffer));
}
```

`stripCodeFences()` removes `` ```markdown `` opening fences and ` ``` ` closing fences. Some models (particularly GPT-4o-mini) sometimes wrap the output in a markdown code block despite the system prompt instruction. The regex handles both a fence with a language identifier and a bare fence:

```typescript
text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```\s*$/, '');
```

---

### 10. Authentication Flow

Every request is protected. The auth flow is:

```
Frontend: getToken() via Clerk useAuth()
        → JWT in Authorization: Bearer <jwt> header

Backend: ClerkHTTPBearer validates JWT against CLERK_JWKS_URL
       → creds.decoded["sub"] = Clerk user_id
       → First line of every endpoint: user_id = creds.decoded["sub"]
```

The JWT is only fetched once per user action — not in a loop. Calling `getToken()` repeatedly on a single session triggers Clerk rate limiting after which `getToken()` returns `null` for the entire session (user must sign out and back in to recover).

---

### 11. Observability: Logging and Analytics

Every request passes through two layers:

**Request-level middleware** (server.py:58-98): Assigns a UUID correlation ID to each request, logs `Request started` and `Request completed` with method, path, status code, and latency in ms. Injects `X-Correlation-ID` response header.

**Endpoint-level analytics**: Two fire-and-forget DynamoDB writes per request:
- `ai_call` event: logged at request start (model, inputs, flags)
- `ai_response` event: logged inside `event_stream()` after stream completes (response length, first 100K chars)

Analytics are dispatched in daemon threads via `_log_event_bg()` so they never add latency to the request path:

```python
# api/server.py:37-44
def _log_event_bg(user_id, event_type, **kwargs):
    threading.Thread(target=log_event, args=(user_id, event_type),
                     kwargs=kwargs, daemon=True).start()
```

---

### 12. DOCX Export (Client-Side)

The "Download" button converts the generated markdown string to a Word document entirely in the browser using the `docx` npm library. The library is dynamically imported to avoid loading it on initial page load:

```typescript
// pages/resume.tsx:683
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
```

The markdown is parsed line-by-line with a simple switch on line prefix (`# `, `## `, `### `, `- `, `* `, plain text). Inline bold/italic/code are handled via a regex split on `**...**`, `*...*`, and `` `...` `` patterns. The resulting `Paragraph[]` array is assembled into a `Document` and serialized to a `Blob` via `Packer.toBlob()`, then saved with `file-saver`.

---

## RESULT

### What the User Experiences

1. **Upload** resume PDF (required) + LinkedIn PDF (optional), enter role and name
2. Click **"Analyze & Score My Resume"** — sees ATS score card for their existing resume (10-20s)
3. Click **"Generate Optimized Resume"** — resume streams in token-by-token (30-90s depending on model)
4. On completion, an ATS **before/after score comparison** appears automatically (e.g. "42 → 87 +45 pts")
5. An expandable **AI Enhancements panel** explains every change the model made
6. One-click **Download as .docx**

### Key Technical Outcomes

| Requirement | Implementation |
|---|---|
| No full-page wait for long AI responses | SSE streaming via `StreamingResponse` + `fetchEventSource` |
| Supports scanned PDFs and images | Hybrid parser: PyPDF2 → GPT-4o-mini Vision OCR fallback |
| Multi-model support without code duplication | OpenAI-compatible API for all 3 providers; single `event_stream()` consumer |
| Before/after ATS score delta | 3-phase workflow; Phase A scores original, Phase C auto-scores generated output |
| Clean resume vs AI notes separation | Delimiter `---AI_ENHANCEMENTS_START---` in system prompt; parsed on every SSE event |
| Correct markdown rendering with newlines | Newline → sentinel space SSE encoding + `remarkBreaks` plugin |
| No Clerk rate limiting | Single `getToken()` call per user action; no retry loops |
| Auth cannot be bypassed | `ClerkHTTPBearer` dependency on every endpoint; `user_id` derived from validated JWT only |

---

## Appendix: Data Flow Diagram

```
Browser                    FastAPI                 External
──────────────────────────────────────────────────────────────
1. handleSubmit()
   ├── fileToBase64(resume)
   └── fileToBase64(linkedin)
                          POST /api/ats-score
                          ├── parse_file_content()
                          │     ├── PyPDF2 (fast)
                          │     └── GPT-4o-mini Vision (fallback)
                          ├── build_ats_score_prompt()
                          └── OpenAI json_object mode ──► OpenAI API
                          ◄── { overall_score, categories, ... }

2. handleGenerate()
   └── connectWithFreshToken()
         └── fetchEventSource POST /api/consultation
                          ├── user_prompt_for()
                          │     ├── parse_file_content(resume_pdf)
                          │     ├── parse_file_content(linkedin_pdf)
                          │     └── assemble prompt blocks
                          ├── model routing (gpt/grok/llama)
                          └── event_stream() generator
                                ├── for chunk in stream:
                                │     yield "data: {line}\n\n"
                                │     yield "data:  \n"      ← newline sentinel
                                └── _log_event_bg() on complete
         onmessage:
           buffer += ev.data
           if "---AI_ENHANCEMENTS_START---" in buffer:
             setResumeContent(before)
             setAiChanges(after)
         onclose:
           setWorkflowStep('complete')

3. [useEffect on 'complete']
   └── callAtsScore({ resume_text: resumeContent })
                          POST /api/ats-score
                          └── resume_text path (no PDF parsing)
   ◄── { overall_score: 87, ... }
       setAtsScoreGenerated(result)
       → render before/after delta

4. downloadResume()
   └── import('docx') [dynamic]
       └── markdown → Paragraph[] → Document → Blob → saveAs()
```
