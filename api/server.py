import os
import base64
import io
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import boto3
from botocore.exceptions import ClientError
from saas.prompts.resume_generator_prompt import system_prompt
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

# S3 client setup for application tracking
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1")
)
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

class ResumeRequest(BaseModel):
    applicant_name: str
    application_date: str
    role_applied_for: str
    phone_number: str
    resume_pdf: str | None = None
    resume_filename: str | None = None
    additional_notes: str
    model: str


class RoadmapRequest(BaseModel):
    current_job_title: str
    time_to_prep_in_months: int
    role_applied_for: str
    resume_pdf: str | None = None
    resume_filename: str | None = None
    additional_notes: str
    model: str


class ApplicationRequest(BaseModel):
    company_name: str
    position: str
    application_date: str
    status: str
    notes: str


#Function to parse PDF content
def parse_pdf_content(base64_pdf: str) -> str:
    """
    Parse PDF content from base64 string and extract text.

    Args:
        base64_pdf: Base64 encoded PDF file

    Returns:
        Extracted text from the PDF
    """
    try:
        # Decode base64 to bytes
        pdf_bytes = base64.b64decode(base64_pdf)
        print(f"Decoded PDF bytes: {len(pdf_bytes)} bytes")

        # Create a BytesIO object from the bytes
        pdf_file = io.BytesIO(pdf_bytes)

        # Read PDF using PyPDF2
        pdf_reader = PdfReader(pdf_file)
        print(f"PDF has {len(pdf_reader.pages)} pages")

        # Extract text from all pages
        text_content = []
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            print(f"Extracted {len(text)} chars from page {i+1}")
            text_content.append(text)

        # Join all pages with double newline
        full_text = "\n\n".join(text_content)
        print(f"Total extracted text: {len(full_text)} characters")
        return full_text
    except Exception as e:
        print(f"ERROR parsing PDF: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")

def user_prompt_for(request: ResumeRequest) -> str:
    prompt_parts = [
        "Create a professional resume for:",
        f"Applicant Name: {request.applicant_name}",
        f"Phone Number: {request.phone_number}",
        f"Application Date: {request.application_date}",
        f"Role Applied For: {request.role_applied_for}",
    ]

    # Add existing resume content if PDF was uploaded
    if request.resume_pdf:
        pdf_content = parse_pdf_content(request.resume_pdf)
        prompt_parts.extend([
            "",
            "=== EXISTING RESUME CONTENT ===",
            pdf_content,
            "=== END OF EXISTING RESUME ===",
            "",
            "Please use the above existing resume as a reference and improve it for the role applied for."
        ])

    # Add additional notes
    prompt_parts.extend([
        "",
        "Additional Notes from Applicant:",
        request.additional_notes if request.additional_notes else "None provided"
    ])

    return "\n".join(prompt_parts)


def user_prompt_for_roadmap(request: RoadmapRequest) -> str:
    """
    Generate user prompt for career roadmap consultation.

    Args:
        request: RoadmapRequest containing career transition details

    Returns:
        Formatted prompt string for the AI model
    """
    prompt_parts = [
        "Create a detailed career transition roadmap for:",
        f"Current Role: {request.current_job_title}",
        f"Target Role: {request.role_applied_for}",
        f"Preparation Time: {request.time_to_prep_in_months} months",
    ]

    # Add existing resume content if PDF was uploaded
    if request.resume_pdf:
        pdf_content = parse_pdf_content(request.resume_pdf)
        prompt_parts.extend([
            "",
            "=== CURRENT RESUME/BACKGROUND ===",
            pdf_content,
            "=== END OF RESUME ===",
            "",
            "Please analyze the above resume to understand the candidate's current skills and experience."
        ])

    # Add additional notes
    prompt_parts.extend([
        "",
        "Additional Information:",
        request.additional_notes if request.additional_notes else "None provided",
        "",
        "Please provide a comprehensive roadmap that includes:",
        "- Month-by-month learning plan",
        "- Recommended resources and courses",
        "- Key projects to build",
        "- Interview preparation timeline",
        "- Networking and application strategy"
    ])

    return "\n".join(prompt_parts) 

# API endpoint for resume consultation
@app.post("/api/consultation")
def consultation_summary(
    request: ResumeRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]

    user_prompt = user_prompt_for_roadmap(request)
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

            try:
                # Hugging Face uses OpenAI-compatible API
                hf_client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=api_key,
                )

                print(f"HF Request - Model: meta-llama/Llama-3.1-70B-Instruct")
                print(f"HF Request - Messages: {prompt}")
                print(f"HF Request - Max tokens: 2048")

                stream = hf_client.chat.completions.create(
                    model="meta-llama/Llama-3.1-70B-Instruct",
                    messages=prompt,
                    stream=True,
                    max_tokens=2048,
                )
            except Exception as e:
                print(f"HUGGING FACE ERROR: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                # Try to get more details from the error
                if hasattr(e, 'response'):
                    print(f"Response status: {e.response.status_code}")
                    print(f"Response body: {e.response.text}")
                raise HTTPException(status_code=500, detail=f"Hugging Face API error: {str(e)}")

            
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
        # All models (OpenAI, xAI Grok, and Hugging Face) use the same response format
        # since they all use the OpenAI-compatible API
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


#API for roadmap consultation

@app.post("/api/roadmap_consultation")
def roadmap_consultation_summary(
    request: RoadmapRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]

    user_prompt = user_prompt_for_roadmap(request)
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

            try:
                # Hugging Face uses OpenAI-compatible API
                hf_client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=api_key,
                )

                print(f"HF Request - Model: meta-llama/Llama-3.1-70B-Instruct")
                print(f"HF Request - Messages: {prompt}")
                print(f"HF Request - Max tokens: 2048")

                stream = hf_client.chat.completions.create(
                    model="meta-llama/Llama-3.1-70B-Instruct",
                    messages=prompt,
                    stream=True,
                    max_tokens=2048,
                )
            except Exception as e:
                print(f"HUGGING FACE ERROR: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                # Try to get more details from the error
                if hasattr(e, 'response'):
                    print(f"Response status: {e.response.status_code}")
                    print(f"Response body: {e.response.text}")
                raise HTTPException(status_code=500, detail=f"Hugging Face API error: {str(e)}")

            
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
        # All models (OpenAI, xAI Grok, and Hugging Face) use the same response format
        # since they all use the OpenAI-compatible API
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")



# Application Tracking Endpoints

@app.post("/api/applications")
def create_application(
    request: ApplicationRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Create a new job application and store it in S3"""
    user_id = creds.decoded["sub"]

    if not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    try:
        # Generate unique ID for the application
        application_id = str(uuid.uuid4())

        # Create application object
        application = {
            "id": application_id,
            "user_id": user_id,
            "company_name": request.company_name,
            "position": request.position,
            "application_date": request.application_date,
            "status": request.status,
            "notes": request.notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Store in S3
        s3_key = f"applications/{user_id}/{application_id}.json"
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(application),
            ContentType='application/json'
        )

        return {"message": "Application created successfully", "application": application}

    except ClientError as e:
        print(f"S3 Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store application: {str(e)}")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create application: {str(e)}")


@app.get("/api/applications")
def get_applications(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Retrieve all job applications for the authenticated user from S3"""
    user_id = creds.decoded["sub"]

    if not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    try:
        # List all objects for this user
        s3_prefix = f"applications/{user_id}/"
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=s3_prefix
        )

        applications = []

        # If no objects found, return empty list
        if 'Contents' not in response:
            return {"applications": applications}

        # Fetch each application
        for obj in response['Contents']:
            try:
                # Get the object from S3
                file_obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=obj['Key'])
                file_content = file_obj['Body'].read().decode('utf-8')
                application = json.loads(file_content)
                applications.append(application)
            except Exception as e:
                print(f"Error reading application {obj['Key']}: {e}")
                continue

        # Sort by created_at (newest first)
        applications.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return {"applications": applications}

    except ClientError as e:
        print(f"S3 Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve applications: {str(e)}")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get applications: {str(e)}")


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
