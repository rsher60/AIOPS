 Code Flow Documentation: Healthcare Consultation Assistant

  Application Architecture Overview

  - Frontend: Next.js 15 (Pages Router) - Static site exported as HTML/CSS/JS
  - Backend: FastAPI (Python) - Serves API endpoints + static files
  - Authentication: Clerk (JWT-based)
  - AI Provider: OpenAI GPT
  - Deployment: Docker container running FastAPI + serving Next.js static files

  ---
  1. APPLICATION STARTUP FLOW

  Docker Container Initialization

  - File: Dockerfile
  - Entry Point: CMD ["uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000"]

  Flow:
  1. Docker container starts
  2. Uvicorn loads api/server.py
  3. FastAPI app initializes (app = FastAPI())
  4. CORS middleware configured (lines 14-20 in server.py)
  5. Clerk authentication configured:
    - Loads CLERK_JWKS_URL from environment (line 23)
    - Creates clerk_guard authentication dependency (line 24)
  6. API routes registered:
    - POST /api/consultation (line 47)
    - GET /health (line 79)
  7. Static file serving configured (lines 85-93):
    - Mounts Next.js static files from ./static directory
    - Sets up catch-all route for SPA routing
  8. Server starts listening on 127.0.0.1:8000

  ---
  2. ENDPOINT: GET / (Homepage)

  User Action: Navigates to http://127.0.0.1:8000/

  Flow:
  1. FastAPI (api/server.py:88-90)
    - Receives GET request to /
    - Executes serve_root() function
    - Returns static/index.html
  2. Browser loads HTML file
    - Parses HTML from pages/_document.tsx structure
    - Loads JavaScript bundles and CSS
  3. Next.js Client (pages/_app.tsx)
    - ClerkProvider wraps entire app (line 8)
    - Initializes Clerk authentication client-side
    - Loads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY from build-time env
  4. Homepage Component (pages/index.tsx)
    - Renders landing page
    - Clerk components check authentication status:
        - <SignedOut> (lines 16-22): Shows "Sign In" button if not authenticated
      - <SignedIn> (lines 23-33): Shows "Go to App" link if authenticated
    - Two CTA buttons (lines 25-29, 90-94):
        - "Go to App": Links to /product
      - "Open Consultation Assistant": Links to /product

  ---
  3. ENDPOINT: GET /product (Consultation Form)

  User Action: Clicks "Go to App" or "Open Consultation Assistant"

  Flow:

  3.1 Static File Serving

  1. FastAPI (api/server.py:93)
    - StaticFiles middleware intercepts /product request
    - Serves static/product.html
  2. Browser loads product page
    - Loads JavaScript bundle for product page

  3.2 Client-Side Rendering

  3. Next.js App Wrapper (pages/_app.tsx)
    - ClerkProvider initializes
    - Provides authentication context to child components
  4. Product Page Component (pages/product.tsx)

  4. Main Component (lines 223-234):
    - Renders <UserButton> in top-right (lines 227-229)
    - Renders <ResumeGenerationForm> component (line 231)

  ResumeGenerationForm Component (lines 11-221):

  State Initialization (lines 13-26):
    - useAuth() hook gets Clerk authentication context (line 13)
    - Form state: patientName, visitDate, notes (lines 16-18)
    - UI state: output, loading (lines 21-22)
    - Connection refs: controllerRef, isConnectingRef (lines 25-26)

  Cleanup Effect (lines 142-149):
    - Registers cleanup function on component mount
    - Aborts any active SSE connections on unmount

  Form Rendering (lines 151-220):
    - Patient Name input (lines 157-170)
    - Date Picker (react-datepicker component, lines 172-185)
    - Consultation Notes textarea (lines 187-200)
    - Submit button (lines 202-208)
    - Output section with ReactMarkdown (lines 211-219)

  ---
  4. ENDPOINT: POST /api/consultation (AI Summary Generation)

  User Action: Fills form and clicks "Generate Summary"

  Flow:

  4.1 Frontend - Form Submission

  1. handleSubmit() (pages/product.tsx:127-141)
    - Prevents default form submission (line 128)
    - Clears previous output (line 129)
    - Sets loading state to true (line 130)
    - Prepares form data object (lines 133-137):
    {
    patient_name: "...",
    date_of_visit: "2024-11-16",
    notes: "..."
  }
    - Calls connectWithFreshToken(formData) (line 140)
  2. connectWithFreshToken() (pages/product.tsx:28-125)

  2. Connection Guard (lines 33-34):
    - Checks if already connecting, exits if true
    - Sets isConnectingRef.current = true

  Abort Previous Connections (lines 37-41):
    - Aborts any existing SSE connection
    - Creates new AbortController

  Token Retrieval (lines 43-49):
    - Calls getToken() from Clerk's useAuth() hook
    - Gets fresh JWT token for authentication
    - Returns error if no token available

  SSE Connection Setup (lines 51-108):
    - Uses @microsoft/fetch-event-source library
    - Request Configuration:
        - URL: /api/consultation (line 55)
      - Method: POST (line 57)
      - Headers (lines 58-61):
            - Content-Type: application/json
        - Authorization: Bearer {jwt}
      - Body: JSON stringified form data (line 62)

  Event Handlers:
    - onopen (lines 83-102):
        - Checks response status
      - If 200 OK: Connection successful
      - If 403: Token expired, triggers reconnect with fresh token
      - Other errors: Throws exception
    - onmessage (lines 63-67):
        - Receives SSE data chunks
      - Appends to buffer
      - Updates output state (triggers re-render with new text)
    - onerror (lines 68-82):
        - Handles connection errors
      - If 403: Reconnects with fresh token after 1s
      - Otherwise: Lets library handle retry logic
    - onclose (lines 103-107):
        - Connection closed by server
      - Sets loading to false
      - Resets connecting flag

  4.2 Backend - Request Processing

  3. FastAPI Route Handler (api/server.py:47-77)

  3. Authentication (line 50):
    - Depends(clerk_guard) executes before handler
    - Clerk Guard Process:
        - Extracts Authorization: Bearer {token} header
      - Fetches JWKS from CLERK_JWKS_URL
      - Validates JWT signature
      - Decodes JWT payload
      - If invalid: Returns 403 Forbidden
      - If valid: Passes HTTPAuthorizationCredentials to handler

  Request Validation (line 49):
    - Pydantic validates request body against Visit model (lines 26-29)
    - Ensures required fields: patient_name, date_of_visit, notes
    - Type checking performed

  User ID Extraction (line 52):
    - Gets sub claim from decoded JWT
    - Available for tracking/auditing (not currently used)

  Prompt Construction (lines 55-59):
    - Calls user_prompt_for(visit) helper (lines 40-45)
    - Creates prompt array with:
        - System message: Instructions for AI (lines 31-38)
      - User message: Patient consultation details

  OpenAI API Call (lines 53, 61-65):
    - Creates OpenAI client (uses OPENAI_API_KEY env var)
    - Calls chat.completions.create():
        - Model: gpt-5-nano (line 62)
      - Messages: System + user prompts
      - Stream: True (enables streaming response)

  Stream Processing (lines 67-75):
    - event_stream() generator function:
        - Iterates over OpenAI stream chunks
      - Extracts text from chunk.choices[0].delta.content
      - Formats as Server-Sent Events (SSE):
            - Splits text on newlines
        - Each line formatted as: data: {text}\n\n
        - Adds extra data:  \n for proper line breaks in markdown

  Response (line 77):
    - Returns StreamingResponse
    - Media type: text/event-stream
    - Keeps connection open while streaming

  4.3 Frontend - Stream Reception

  4. onmessage Handler (pages/product.tsx:63-67)
    - Receives each SSE event
    - Appends ev.data to buffer
    - Updates output state
    - React re-renders component with new text
  5. ReactMarkdown Rendering (pages/product.tsx:214-216)
    - Parses markdown in output state
    - Renders with:
        - remarkGfm plugin (GitHub Flavored Markdown)
      - remarkBreaks plugin (converts line breaks to <br>)
    - Displays formatted output in real-time
  6. Stream Completion
    - OpenAI finishes generation
    - event_stream() generator exits
    - FastAPI closes SSE connection
    - onclose handler called (line 103)
    - Sets loading = false
    - User sees complete summary

  ---
  5. ENDPOINT: GET /health (Health Check)

  User/System Action: AWS App Runner or monitoring system checks health

  Flow:
  1. Request: GET http://127.0.0.1:8000/health
  2. FastAPI (api/server.py:79-82)
    - Executes health_check() function
    - Returns JSON: {"status": "healthy"}
  3. Response: 200 OK
  4. Use Case:
    - Docker health checks (Dockerfile:40-41)
    - AWS App Runner health monitoring
    - Deployment verification

  ---
  6. AUTHENTICATION FLOW (Clerk)

  Sign In Process

  Frontend (pages/index.tsx:17-21):
  1. User clicks "Sign In" button
  2. <SignInButton mode="modal"> opens Clerk modal
  3. User enters credentials
  4. Clerk authenticates with their servers
  5. Clerk sets session cookie
  6. Page refreshes
  7. <SignedIn> component now shows "Go to App"

  JWT Token Flow

  Token Generation:
  1. User signs in via Clerk
  2. Clerk creates session
  3. Session stored in browser cookies

  Token Usage (pages/product.tsx:43):
  1. getToken() called before API request
  2. Clerk SDK reads session from cookies
  3. Generates JWT token signed by Clerk
  4. Token includes claims:
    - sub: User ID
    - exp: Expiration time
    - Other user metadata

  Token Validation (api/server.py:23-24, 50):
  1. Backend receives Authorization: Bearer {token}
  2. clerk_guard dependency executes:
    - Fetches public keys from CLERK_JWKS_URL
    - Verifies token signature
    - Checks expiration
    - Decodes payload
  3. If valid: Request proceeds
  4. If invalid/expired: Returns 403 Forbidden

  Token Refresh (pages/product.tsx:72-76, 89-95):
  1. If 403 error received
  2. Frontend calls getToken() again (gets fresh token)
  3. Retries request with new token
  4. Automatic reconnection after 1 second delay

  ---
  7. ERROR HANDLING FLOWS

  Authentication Errors (403)

  - Frontend: Detects 403 in onopen or onerror
  - Action: Calls connectWithFreshToken() recursively
  - Result: Automatic retry with fresh token

  Network Errors

  - Frontend: Catches TypeError or fetch errors (line 116)
  - Action: Retries after 2-second delay (line 118)
  - Fallback: Shows "Connection failed" message (line 120)

  OpenAI API Errors

  - Backend: Stream may fail if OpenAI unavailable
  - Frontend: onerror handler triggered
  - Result: Loading stops, error logged to console

  ---
  FILE REFERENCE SUMMARY

  Frontend Files (Next.js)

  - pages/_app.tsx - App wrapper with ClerkProvider
  - pages/_document.tsx - HTML document structure
  - pages/index.tsx - Landing page with sign-in
  - pages/product.tsx - Consultation form and AI interaction

  Backend Files (FastAPI)

  - api/server.py - Main FastAPI application with all endpoints
  - api/index.py - Alternative backend (not currently used in Docker)
  - api/__init__.py - Empty package marker

  Configuration Files

  - Dockerfile - Multi-stage build (Next.js + FastAPI)
  - next.config.ts - Next.js static export configuration
  - .env.local - Environment variables (Clerk keys, OpenAI key)
  - requirements.txt - Python dependencies

  ---
  ENVIRONMENT VARIABLES USED

  Build Time (Docker)

  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Clerk public key for frontend

  Runtime (Docker Container)

  - CLERK_JWKS_URL - Clerk JWT validation endpoint
  - OPENAI_API_KEY - OpenAI API authentication

  ---
  This documentation covers the complete flow from user interaction to API response for all endpoints in your
  healthcare consultation application.


## Important POints


### If you are getting an error where Port is occupied.

# Find what's using port 8000
sudo lsof -i :8000

# Or using netstat
sudo netstat -tulpn | grep :8000

# Kill the process (replace PID with actual process ID)
kill -9 PID



   

docker build --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" -t consultation-app . 



docker run -p 8000:8000 -e CLERK_SECRET_KEY="$CLERK_SECRET_KEY" -e CLERK_JWKS_URL="$CLERK_JWKS_URL" -e OPENAI_API_KEY="$OPENAI_API_KEY" consultation-app



## One of the issues I was facing when trying to sync the changes of the code base with docker 

 🔍 The Problem:

  1. Docker Compose was mounting old static files from ./out:/app/static
  2. The out/ directory had stale files from Nov 16 13:44 (hours old)
  3. Even after rebuilding, Docker was using the old mounted files instead of the newly built ones

  ✅ The Fix:

  1. Deleted the old out/ directory with stale files
  2. Removed the volume mount for static files in docker-compose.yaml
  3. Rebuilt with --no-cache to ensure fresh build

  🚀 Now Access Your App:

  URL: http://127.0.0.1:8000

  Important: Do a hard refresh in your browser:
  - Mac: Cmd + Shift + R
  - Windows/Linux: Ctrl + Shift + R

  You should now see "ResumeGenerator Pro" with the latest changes!

  ---
  📝 Key Takeaway:

  When using Docker Compose, avoid mounting the out/ directory as a volume. Let Docker build it fresh each time. The
   volume mount is only useful for hot-reloading backend code (server.py), not static frontend files.

  Try it now - the latest version should be live! 🎉