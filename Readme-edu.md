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


## We need to load the environment variables while 
   

docker build --no-cache --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" -t resumegen-app . 

sh ./build-docker.sh

docker run -p 8000:8000 \
  -e CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  -e CLERK_JWKS_URL="$CLERK_JWKS_URL" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  resumegen-app



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


### What happens when you run ``docker compose up``

 Step 1: Reading Configuration

  - Docker Compose reads your docker-compose.yaml file
  - Loads environment variables from .env file

  Step 2: Building the Image (if not already built)

  - Looks for Dockerfile in the current directory
  - Builds a Docker image with your Next.js app + FastAPI backend
  - Passes NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY during build
  - This creates a packaged version of your app

  Step 3: Creating Container

  - Creates a container named app from the built image
  - Sets up environment variables (API keys, Clerk secrets, etc.)
  - Mounts ./api/server.py so changes to this file are reflected live

  Step 4: Port Mapping

  - Maps port 8000 on your computer → port 8000 inside container
  - Now you can access the app at http://localhost:8000

  Step 5: Starting the Service

  - Runs the command: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
  - Starts your FastAPI backend server on port 8000
  - The --reload flag enables hot reloading for development

  Result:

  - Your FastAPI backend is running at http://localhost:8000
  - Changes to server.py will auto-reload
  - The container keeps running until you press Ctrl+C or run docker compose down

  Note:

  This only runs your backend API server, not the Next.js frontend. The Next.js dev server (running on port 3000) is separate and
  needs to run with npm run dev.


  ### Important COmmand : docker compose build --no-cache



### Commands to build the ECR image 

# 1. Authenticate Docker to ECR (using your .env values!)
aws ecr get-login-password --region $DEFAULT_AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com


# 1. Remove the old local image
docker rmi resumegenerator-app:latest
docker rmi $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:latest

# 2. Clear Docker build cache (optional but thorough)
docker builder prune -f

# 2. Build for Linux/AMD64 (CRITICAL for Apple Silicon Macs!)
docker build \
  --no-cache \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  -t resumegenerator-app .

-- You willneed to set the Key 
# 3. Tag your image (using your .env values!)
docker tag resumegenerator-app:latest $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:latest

# 4. Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:latest

# Force App Runner to pull and deploy the new image
  aws apprunner start-deployment \
    --service-arn $(aws apprunner list-services --region $DEFAULT_AWS_REGION --query 'ServiceSummaryList[0].ServiceArn' --output text) \
    --region $DEFAULT_AWS_REGION




## Commands to resolve the docker caching issue with ECR 


### Commands to build and push ECR image with unique tags

# 1. Authenticate Docker to ECR
aws ecr get-login-password --region $DEFAULT_AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com

# 2. Create a unique tag (using timestamp)
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
# OR use git commit SHA if you're in a git repo:
# IMAGE_TAG=$(git rev-parse --short HEAD)



# 3. Clean up old images (optional)
docker rmi resumegenerator-app:$IMAGE_TAG 2>/dev/null || true
docker builder prune -f

# 4. Build with unique tag
docker build \
  --no-cache \
  --pull \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  -t resumegenerator-app:$IMAGE_TAG \
  -t resumegenerator-app:latest \
  .

# 5. Tag for ECR with unique tag AND latest
docker tag resumegenerator-app:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:$IMAGE_TAG

docker tag resumegenerator-app:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:latest

# 6. Push BOTH tags to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:latest

# 7. Verify the new image was pushed (check digest)
aws ecr describe-images \
  --repository-name resumegenerator-app \
  --region $DEFAULT_AWS_REGION \
  --query 'sort_by(imageDetails,& imagePushedAt)[-1].[imageTags[0], imageDigest, imagePushedAt]' \
  --output table

# 8. Update App Runner to use the specific tag (CRITICAL!)
SERVICE_ARN=$(aws apprunner list-services \
  --region $DEFAULT_AWS_REGION \
  --query 'ServiceSummaryList[0].ServiceArn' \
  --output text)

# Update the service to point to the new specific tag
aws apprunner update-service \
  --service-arn $SERVICE_ARN \
  --source-configuration "ImageRepository={ImageIdentifier=$AWS_ACCOUNT_ID.dkr.ecr.$DEFAULT_AWS_REGION.amazonaws.com/resumegenerator-app:$IMAGE_TAG,ImageRepositoryType=ECR}" \
  --region $DEFAULT_AWS_REGION

# 9. Wait for deployment to complete
aws apprunner wait service-updated --service-arn $SERVICE_ARN --region $DEFAULT_AWS_REGION

echo "Deployment complete with image tag: $IMAGE_TAG"




## UI Learnings

I ran into a issue where for the first time when the user was clikcing on the links, it was not redirecting and this was happening because I was using regular HTML Anchor tags (<>) instead of Next.Js Link components. 
This was causing a full page reload on the first click of client side navigation


## Issue with API Gateway

MY API Gateway was working, but the static assets (CSS, JavaScript, images) were not loading
properly. I solved it by adding a catch all rout and doing the following steps:

Integration settings:

Integration type: HTTP
HTTP method: ANY
Integration URL <>/{proxy} (note the {proxy} parameter)

This ensures requests like:

/static/css/main.css
/assets/js/app.js
/images/logo.png


### Beta Testing Setup

**Setup Phase:**
- [ ] Lambda function created with token validation code
- [ ] Lambda function deployed
- [ ] Lambda authorizer created in API Gateway
- [ ] Identity source configured: `$request.header.Authorization`
- [ ] Authorizer attached to all routes
- [ ] API Gateway deployed

**Testing Phase:**
- [ ] Test without token (should fail with 401)
- [ ] Test with valid token (should work)
- [ ] Test all routes (/roadmap, /product, etc.)
- [ ] Test with invalid token (should fail)

**Distribution Phase:**
- [ ] Generate unique token for each beta tester
- [ ] Send access instructions to beta testers
- [ ] Set up feedback channel



## What I did was :

1) I created a HTTP API GAteway and then used a Lambda to invoke the auth check



### SYStem Design 

AWS API Gateway Lambda Authorizer with Query String Tokens
Documentation Summary

Overview
This setup implements a Lambda-based authentication layer for AWS API Gateway that sits in front of an App Runner application. It restricts API access to authorized test users while allowing static assets (CSS, JS, images) to load without authentication.

Architecture
User Request with Token
         ↓
    API Gateway (HTTP API)
         ↓
   Lambda Authorizer (validates token)
         ↓
   Authorization Decision (Allow/Deny)
         ↓
    App Runner Application
         ↓
    Response to User
Components:

API Gateway (HTTP API): Entry point for all requests, acts as a proxy
Lambda Authorizer: Validates tokens and allows/denies access (ONLY for authentication)
App Runner: Hosts and runs your actual application
Token Storage: Hard-coded in Lambda authorizer (for testing)


How It Works
Request Flow:

User makes request with token in query string:

   https://api-url.com/?token=user1-token-abc123

API Gateway receives request and invokes the Lambda Authorizer
Lambda Authorizer checks:

Is this a static asset (.css, .js, .png, etc.)? → Allow without token
Is this an HTML/API request? → Check token validity
Valid token? → Allow access
Invalid/missing token? → Deny access


API Gateway enforces the decision:

If Allowed → Forwards request to App Runner
If Denied → Returns 401/403 to user


App Runner serves the application content


The Critical Issue We Solved
Problem:
Initially, the Lambda Authorizer wasn't being called for CSS/JS file requests. API Gateway was blocking them with 401 errors before the Lambda could execute, preventing your App Runner application's static assets from loading.
Root Cause:
The Identity Source was set to $request.querystring.token. When CSS/JS files were requested (without ?token= in their URLs), API Gateway immediately returned 401 because the identity source was missing.
Solution:
Changed Identity Source from $request.querystring.token to $request.header.user-agent
Why this works:

Every HTTP request includes a user-agent header
API Gateway now calls the Lambda for ALL requests
Lambda code decides what to allow/deny based on file type and token presence
Static assets load without tokens and are forwarded to App Runner
HTML pages still require valid tokens


### 405 Errors for specific Paths 

> I am getting a 405 error when trying to download the generated resume but not getting the same error in local. Please make 
required changes to make sure that it works. I believe its because of the convert-tp-docx.ts file 
  ⎿  ⧉ Selected 1 lines from api/server.py in Visual Studio Code

⏺ The 405 error is happening because your app is using next export for static deployment, which disables API routes. I saw this warning in the build output. I'll fix this by implementing client-side DOCX generation instead of using a server API.


### UI Terminology 

 UI Component Terminology Guide

  Here's a comprehensive breakdown of UI components across your application files:

  ---
  index.tsx (Landing Page)

  Layout Components

  - Container - <div className="container mx-auto"> - Main content wrapper with centered max-width
  - Hero Section - Lines 318-427 - Large prominent section at top with main heading and CTA
  - Grid Layout - grid md:grid-cols-3 - Multi-column responsive layout system

  Navigation Components

  - Navigation Bar / Navbar - Lines 294-315 - Top horizontal navigation
  - Hamburger Menu Button - Lines 297-305 - Three-line icon button that opens side panel
  - Side Panel / Drawer / Sidebar - Lines 10-129 - Slide-out navigation menu from left
  - Overlay / Backdrop - Lines 14-19 - Semi-transparent black background behind modal/panel
  - Navigation Links - Lines 61-115 - Clickable links within navigation menu

  Interactive Components

  - Button (Primary CTA) - Lines 414-418 "Create Resume" - Primary call-to-action button
  - Button (Secondary/Outline) - Lines 419-423 "Plan Career" - Outlined button variant
  - Sticky Button - Lines 280-290 "Start Free" - Fixed position button
  - Accordion / Collapsible Section - Lines 431-479 "How It Works" - Expandable/collapsible content
  - Expandable Cards - Lines 369-408 - Feature cards that expand on click

  Content Components

  - Badge - Lines 311-313 "BETA" - Small label/tag
  - Stat Cards / Metric Cards - Lines 349-365 - Cards displaying numerical statistics
  - Feature Cards - Lines 369-408 - Cards highlighting product features
  - Step Cards / Process Cards - Lines 454-477 - Sequential numbered instruction cards
  - Trust Indicators / Trust Badges - Lines 500-517 - Security/compliance badges

  Visual Elements

  - Animated Background Shapes / Blobs - Lines 226-250 - Decorative floating gradient circles
  - Floating Particles - Lines 252-264 - Small animated dots
  - Cursor Glow / Interactive Cursor - Lines 267-274 - Glow effect following mouse
  - Divider / Separator - Lines 506, 511 - Vertical line separating elements

  Media Components

  - Image Card - Lines 330-344 - Card containing product demo image
  - Footer Image / Banner Image - Lines 482-497 - Promotional image link

  Typography Components

  - Heading (H1) - Line 308 "ResumeGenerator Pro"
  - Heading (H2) - Line 319 with typing animation
  - Subheading / Tagline - Lines 325-327 - Descriptive text under main heading

  ---
  ApplicationTracker.tsx

  Layout Components

  - Container - Line 325 - Main content wrapper
  - Two-Column Grid / Split Layout - Line 330 - Form on left, table on right
  - Sticky Sidebar - Line 333 - Left panel that stays fixed while scrolling

  Form Components

  - Form - Lines 333-422 - Complete input form
  - Form Group / Field Group - Lines 338-351 - Label + input combination
  - Text Input / Input Field - Lines 342-350 - Single-line text entry
  - Date Picker / Calendar Input - Lines 372-380 - Date selection widget
  - Dropdown / Select Menu - Lines 387-398 - Selection from predefined options
  - Textarea / Multi-line Input - Lines 405-412 - Multi-line text entry
  - Submit Button - Lines 415-421 - Form submission button
  - Input Label - Lines 339-341 - Descriptive text for inputs

  Data Display Components

  - Table - Lines 455-525 - Structured data in rows/columns
  - Table Header / thead - Lines 456-476 - Column headers
  - Table Body / tbody - Lines 478-524 - Data rows
  - Table Row / tr - Lines 480-522 - Single row of data
  - Table Cell / td - Lines 481-521 - Individual data cell
  - Status Badge / Pill - Lines 497-499 - Colored label showing status
  - Empty State - Lines 450-452 - Message when no data exists
  - Loading State - Lines 446-448 - Message during data fetch

  Modal Components

  - Modal / Dialog - Lines 533-624 - Popup overlay window
  - Modal Backdrop - Line 534 - Dark transparent background
  - Modal Content / Modal Body - Lines 535-623 - Main modal container
  - Modal Header - Lines 536-538 - Modal title area
  - Modal Footer / Action Bar - Lines 603-620 - Bottom button area

  Action Components

  - Action Buttons - Lines 508-520 - Edit/Delete buttons
  - Icon Button - Lines 654-662 - Button with hamburger icon
  - Export Button - Lines 433-441 - CSV download button

  File Upload Components

  - File Upload Zone - ApplicationTracker doesn't have this, but resume.tsx does

  ---
  resume.tsx (Resume Generator)

  Layout Components

  - Container - Line 446 - Main wrapper
  - Split Panel Layout / Two-Panel Layout - Line 451 - Form and output panels
  - Left Panel / Form Panel - Lines 453-615 - Input form side
  - Right Panel / Output Panel - Lines 617-723 - Results display side
  - Sticky Panel - Line 453 - Panel that stays in viewport

  Form Components

  - Multi-step Form - Lines 454-614 - Complex form with multiple sections
  - File Upload Dropzone / Drag-and-drop Zone - Lines 537-591 - Drag-drop file area
  - Range Slider / Slider Input - N/A in resume.tsx (in Roadmap.tsx though)
  - File Preview Card - Lines 555-572 - Shows uploaded file details

  Display Components

  - Output Section / Results Panel - Lines 620-660 - AI-generated content area
  - Markdown Viewer / Content Area - Lines 634-659 - Rendered markdown content
  - Expandable Panel / Accordion Panel - Lines 663-714 - AI Enhancements collapsible section
  - Download Button - Lines 626-635 - Action button for export

  Status Components

  - Loading State / Spinner State - When loading is true
  - Empty State / Placeholder - Lines 717-720 - Before content generation

  ---
  Roadmap.tsx

  Form Components (unique to Roadmap)

  - Range Slider / Slider Control - Lines 457-473 - Months selection with min/max labels
  - Slider Labels - Lines 470-473 - Min/max value display under slider

  Similar components to resume.tsx

  - All other components mirror resume.tsx structure

  ---
  Common Component Types Across All Files

  Universal Components

  - SidePanel Component - Reusable navigation drawer in all pages
  - User Profile Section - Lines 24-30 (in SidePanel) - User account area
  - Navigation Menu / Nav Menu - Lines 32-61 (in SidePanel) - List of navigation links
  - Menu Item / Nav Item - Lines 33-60 - Individual clickable navigation option
  - Footer - Lines 119-124 (in SidePanel), Lines 626-642 (in pages) - Bottom section

  Button Variations

  - Primary Button - Solid gradient background
  - Secondary Button - Outlined border style
  - Ghost Button - Minimal style, usually text only
  - Icon Button - Button with icon, minimal/no text
  - Disabled Button - Non-clickable state
  - Loading Button - Shows loading text/spinner

  Card Variations

  - Basic Card - Simple bordered container
  - Elevated Card / Shadow Card - Card with drop shadow
  - Interactive Card - Hover effects, clickable
  - Stat Card - Displays metrics/numbers
  - Feature Card - Product feature showcase
  - Data Card - Contains structured information

  ---
  General UI Terminology

  Layout Terms

  - Viewport - Visible area of the screen
  - Container - Content wrapper with max-width
  - Section - Distinct content area
  - Panel - Distinct bordered/separated area
  - Grid - Multi-column layout
  - Flexbox - Flexible row/column layout
  - Responsive Breakpoints - sm:, md:, lg: prefixes

  State Terms

  - Hover State - Appearance on mouse over
  - Active State - Appearance when clicked
  - Focus State - Appearance when selected via keyboard
  - Disabled State - Non-interactive appearance
  - Loading State - Appearance during data fetch
  - Empty State - Appearance when no data

  Animation Terms

  - Transition - Smooth change between states
  - Transform - Scale, rotate, translate effects
  - Fade In/Out - Opacity animation
  - Slide In/Out - Position animation
  - Stagger - Sequential animation delays
