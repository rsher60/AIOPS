import os
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

# Add CORS middleware (allows frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clerk authentication setup
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

class ResumeRequest(BaseModel):
    applicant_name: str
    application_date: str
    role_applied_for: str
    phone_number: str
    additional_notes: str
    model: str

system_prompt = """
You are a professional resume writer and career advisor.
You are provided with an applicant's information for a job application.
Your job is to create a professional resume tailored to the role they are applying for.

Generate a comprehensive resume with the following sections:
### Professional Summary
### Key Skills
### Tailored Resume Points for the Role
### Suggestions for Improvement
"""

def user_prompt_for(request: ResumeRequest) -> str:
    return f"""Create a professional resume for:
Applicant Name: {request.applicant_name}
Phone Number: {request.phone_number}
Application Date: {request.application_date}
Role Applied For: {request.role_applied_for}
Additional Notes from Applicant:
{request.additional_notes if request.additional_notes else "None provided"}"""

@app.post("/api/consultation")
def consultation_summary(
    request: ResumeRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]

    user_prompt = user_prompt_for(request)
    prompt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # Select the appropriate model and client based on user's choice
    try:
        if request.model == "gpt-4o-mini":
            # OpenAI GPT model
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")

            client = OpenAI(api_key=api_key)
            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=prompt,
                stream=True,
            )
        elif request.model == "grok-beta":
            # xAI Grok model (uses OpenAI-compatible API)
            api_key = os.getenv("XAI_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="xAI API key not configured. Please add your XAI_API_KEY to the .env file")

            client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=os.getenv("XAI_API_KEY"),
            )

            stream = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=prompt,
                stream=True,
            )
        elif request.model == "llama-70b":
            # Hugging Face Llama model
            api_key = os.getenv("HUGGINGFACE_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="Hugging Face API key not configured. Please add your HUGGINGFACE_API_KEY to the .env file")

            from huggingface_hub import InferenceClient
            hf_client = InferenceClient(token=api_key)

            # Combine system and user prompts for HF
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"

            stream = hf_client.text_generation(
                prompt=combined_prompt,
                model="meta-llama/Meta-Llama-3.1-70B-Instruct",
                stream=True,
                max_new_tokens=2048,
            )
        else:
            # Default to GPT if unknown model
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")

            client = OpenAI(api_key=api_key)
            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=prompt,
                stream=True,
            )
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        # Catch any other errors (invalid API keys, network issues, etc.)
        error_msg = str(e)
        if "Incorrect API key" in error_msg or "invalid" in error_msg.lower():
            raise HTTPException(status_code=400, detail=f"Invalid API key for {request.model}. Please check your API key configuration in the .env file")
        elif "authentication" in error_msg.lower():
            raise HTTPException(status_code=401, detail=f"Authentication failed for {request.model}. Please verify your API key")
        else:
            raise HTTPException(status_code=500, detail=f"Error initializing {request.model}: {error_msg}")

    def event_stream():
        if request.model == "llama-70b":
            # Hugging Face returns plain text chunks
            for chunk in stream:
                if chunk:
                    lines = chunk.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
        else:
            # OpenAI and xAI (Grok) use the same response format
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/health")
def health_check():
    """Health check endpoint for AWS App Runner"""
    return {"status": "healthy"}

# Serve static files (our Next.js export) - MUST BE LAST!
static_path = Path("static")
if static_path.exists():
    # Serve index.html for the root path
    @app.get("/")
    async def serve_root():
        return FileResponse(static_path / "index.html")

    # Mount static files for all other routes
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
