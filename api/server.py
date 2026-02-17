import os
import base64
import io
import json
import time
import uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Request
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
from saas.prompts.message_rewriter_prompt import message_rewriter_system_prompt
from saas.prompts.company_research_prompt import company_research_system_prompt
from saas.logger import setup_logging, get_logger, correlation_id_var
from saas.analytics import log_event, log_login_if_new

load_dotenv()
setup_logging()
logger = get_logger("api")

app = FastAPI()

# Add CORS middleware (allows frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with a unique correlation ID and latency."""
    req_id = str(uuid.uuid4())
    correlation_id_var.set(req_id)

    is_health = request.url.path == "/health"
    client_ip = request.client.host if request.client else None

    if not is_health:
        logger.info(
            "Request started",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
            },
        )

    start = time.time()
    response = await call_next(request)
    latency_ms = round((time.time() - start) * 1000, 2)

    if not is_health:
        logger.info(
            "Request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "latency_ms": latency_ms,
            },
        )
    else:
        logger.debug(
            "Health check",
            extra={"status_code": response.status_code, "latency_ms": latency_ms},
        )

    response.headers["X-Correlation-ID"] = req_id
    return response


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
    linkedin_profile_pdf: str | None = None
    resume_filename: str | None = None
    additional_notes: str
    model: str


class RoadmapRequest(BaseModel):
    current_job_title: str
    time_to_prep_in_months: int
    role_applied_for: str
    resume_pdf: str | None = None
    linkedin_profile_pdf: str | None = None
    resume_filename: str | None = None
    additional_notes: str
    model: str


class ApplicationRequest(BaseModel):
    company_name: str
    position: str
    application_date: str
    status: str
    notes: str


class MessageRewriteRequest(BaseModel):
    original_message: str
    message_type: str  # referral, cold_outreach, follow_up, thank_you, networking, negotiation, offer_acceptance, general
    formality_level: int  # 1-5
    recipient_type: str  # recruiter, hiring_manager, employee, peer
    additional_context: str
    model: str


class CompanyResearchRequest(BaseModel):
    company_name: str
    target_role: str | None = None
    research_focus: str | None = None  # specific areas to focus on
    model: str


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
        logger.debug("Decoded PDF", extra={"size_bytes": len(pdf_bytes)})

        # Create a BytesIO object from the bytes
        pdf_file = io.BytesIO(pdf_bytes)

        # Read PDF using PyPDF2
        pdf_reader = PdfReader(pdf_file)
        logger.debug("PDF opened", extra={"page_count": len(pdf_reader.pages)})

        # Extract text from all pages
        text_content = []
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            logger.debug("Extracted page text", extra={"page": i + 1, "char_count": len(text)})
            text_content.append(text)

        # Join all pages with double newline
        full_text = "\n\n".join(text_content)
        logger.debug("PDF parsing complete", extra={"total_chars": len(full_text)})
        return full_text
    except Exception as e:
        logger.error("PDF parsing failed", extra={"error_type": type(e).__name__}, exc_info=True)
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

    if request.linkedin_profile_pdf:
        linkedin_pdf_content = parse_pdf_content(request.linkedin_profile_pdf)
        prompt_parts.extend([
            "",
            "=== LINKEDIN PROFILE CONTENT ===",
            "(This is the user's LinkedIn PDF export - use this as the PRIMARY source for contact info and to enrich resume content)",
            "",
            linkedin_pdf_content,
            "",
            "=== END OF LINKEDIN PROFILE ===",
            "",
            "IMPORTANT: When generating the resume, prioritize LinkedIn data for contact information (email, phone, location). Merge skills, experience details, and certifications from both sources. Extract valuable content like headline, recommendations, and endorsements."
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

    # Add LinkedIn profile content if PDF was uploaded
    if request.linkedin_profile_pdf:
        linkedin_pdf_content = parse_pdf_content(request.linkedin_profile_pdf)
        prompt_parts.extend([
            "",
            "=== LINKEDIN PROFILE CONTENT ===",
            "(This provides additional context about the candidate's professional network, endorsements, and career history)",
            "",
            linkedin_pdf_content,
            "",
            "=== END OF LINKEDIN PROFILE ===",
            "",
            "Use the LinkedIn profile to understand: skills with endorsements (indicating validated strengths), career progression, professional network/connections in target industry, recommendations from colleagues, and any relevant certifications or courses."
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
    log_login_if_new(user_id)
    log_event(user_id, "ai_call", endpoint="/api/consultation", model=request.model)
    logger.info(
        "AI request received",
        extra={"endpoint": "/api/consultation", "user_id": user_id, "model": request.model},
    )

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

            try:
                hf_client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=api_key,
                )
                logger.debug(
                    "HuggingFace request",
                    extra={"model": "meta-llama/Llama-3.1-70B-Instruct", "max_tokens": 2048},
                )
                stream = hf_client.chat.completions.create(
                    model="meta-llama/Llama-3.1-70B-Instruct",
                    messages=prompt,
                    stream=True,
                    max_tokens=2048,
                )
            except Exception as e:
                extra = {"error_type": type(e).__name__, "model": "llama-70b"}
                if hasattr(e, 'response'):
                    extra["response_status"] = e.response.status_code
                    extra["response_body"] = e.response.text
                logger.error("HuggingFace API error", extra=extra, exc_info=True)
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
        raise
    except Exception as e:
        error_msg = str(e)
        if "Incorrect API key" in error_msg or "invalid" in error_msg.lower():
            logger.warning("Invalid API key", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=400, detail=f"Invalid API key for {request.model}. Please check your API key configuration in the .env file")
        elif "authentication" in error_msg.lower():
            logger.warning("Authentication failed", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=401, detail=f"Authentication failed for {request.model}. Please verify your API key")
        else:
            logger.error("Model initialization error", extra={"model": request.model, "user_id": user_id}, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error initializing {request.model}: {error_msg}")

    def event_stream():
        logger.info("AI stream started", extra={"endpoint": "/api/consultation", "user_id": user_id, "model": request.model})
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            logger.info("AI stream completed", extra={"endpoint": "/api/consultation", "user_id": user_id, "model": request.model})
        except Exception as e:
            logger.error("AI stream error", extra={"endpoint": "/api/consultation", "user_id": user_id, "model": request.model}, exc_info=True)
            raise

    return StreamingResponse(event_stream(), media_type="text/event-stream")


#API for roadmap consultation

@app.post("/api/roadmap_consultation")
def roadmap_consultation_summary(
    request: RoadmapRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    log_event(user_id, "ai_call", endpoint="/api/roadmap_consultation", model=request.model)
    logger.info(
        "AI request received",
        extra={"endpoint": "/api/roadmap_consultation", "user_id": user_id, "model": request.model},
    )

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
                hf_client = OpenAI(
                    base_url="https://router.huggingface.co/v1",
                    api_key=api_key,
                )
                logger.debug(
                    "HuggingFace request",
                    extra={"model": "meta-llama/Llama-3.1-70B-Instruct", "max_tokens": 2048},
                )
                stream = hf_client.chat.completions.create(
                    model="meta-llama/Llama-3.1-70B-Instruct",
                    messages=prompt,
                    stream=True,
                    max_tokens=2048,
                )
            except Exception as e:
                extra = {"error_type": type(e).__name__, "model": "llama-70b"}
                if hasattr(e, 'response'):
                    extra["response_status"] = e.response.status_code
                    extra["response_body"] = e.response.text
                logger.error("HuggingFace API error", extra=extra, exc_info=True)
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
        raise
    except Exception as e:
        error_msg = str(e)
        if "Incorrect API key" in error_msg or "invalid" in error_msg.lower():
            logger.warning("Invalid API key", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=400, detail=f"Invalid API key for {request.model}. Please check your API key configuration in the .env file")
        elif "authentication" in error_msg.lower():
            logger.warning("Authentication failed", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=401, detail=f"Authentication failed for {request.model}. Please verify your API key")
        else:
            logger.error("Model initialization error", extra={"model": request.model, "user_id": user_id}, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error initializing {request.model}: {error_msg}")

    def event_stream():
        logger.info("AI stream started", extra={"endpoint": "/api/roadmap_consultation", "user_id": user_id, "model": request.model})
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            logger.info("AI stream completed", extra={"endpoint": "/api/roadmap_consultation", "user_id": user_id, "model": request.model})
        except Exception as e:
            logger.error("AI stream error", extra={"endpoint": "/api/roadmap_consultation", "user_id": user_id, "model": request.model}, exc_info=True)
            raise

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Message Rewriter API Endpoint

@app.post("/api/rewrite-message")
def rewrite_message(
    request: MessageRewriteRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Rewrite a message for professional communication with 3 variations"""
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    log_event(user_id, "ai_call", endpoint="/api/rewrite-message", model=request.model)
    logger.info(
        "AI request received",
        extra={
            "endpoint": "/api/rewrite-message",
            "user_id": user_id,
            "model": request.model,
            "message_type": request.message_type,
            "formality_level": request.formality_level,
            "recipient_type": request.recipient_type,
        },
    )

    # Build user prompt
    formality_labels = {
        1: "Casual (for peers/friends)",
        2: "Friendly Professional (for recruiters you've talked to)",
        3: "Professional (for hiring managers)",
        4: "Formal (for executives/VPs)",
        5: "Very Formal (for C-suite)"
    }

    message_type_labels = {
        "referral": "Referral Request",
        "cold_outreach": "Cold Outreach",
        "follow_up": "Follow-Up Message",
        "thank_you": "Thank You Note",
        "networking": "Networking Message",
        "negotiation": "Salary/Offer Negotiation",
        "offer_acceptance": "Offer Acceptance",
        "general": "General Professional Rewrite"
    }

    recipient_labels = {
        "recruiter": "Recruiter",
        "hiring_manager": "Hiring Manager",
        "employee": "Company Employee",
        "peer": "Peer/Professional Connection"
    }

    user_prompt = f"""Please rewrite the following message:

MESSAGE TYPE: {message_type_labels.get(request.message_type, request.message_type)}
FORMALITY LEVEL: {request.formality_level} - {formality_labels.get(request.formality_level, 'Professional')}
RECIPIENT: {recipient_labels.get(request.recipient_type, request.recipient_type)}

ORIGINAL MESSAGE:
{request.original_message}
"""

    if request.additional_context:
        user_prompt += f"\n\nADDITIONAL CONTEXT:\n{request.additional_context}"

    user_prompt += "\n\nGenerate 3 distinct variations of this message following all guidelines. Remember to separate each variation with ---VARIATION_SEPARATOR---"

    prompt = [
        {"role": "system", "content": message_rewriter_system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # Select AI model
    try:
        if request.model == "gpt-4o-mini":
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
            api_key = os.getenv("XAI_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="xAI API key not configured")

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
            api_key = os.getenv("HUGGINGFACE_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="Hugging Face API key not configured")

            hf_client = OpenAI(
                base_url="https://router.huggingface.co/v1",
                api_key=api_key,
            )
            logger.debug(
                "HuggingFace request",
                extra={"model": "meta-llama/Llama-3.1-70B-Instruct", "max_tokens": 2048},
            )
            stream = hf_client.chat.completions.create(
                model="meta-llama/Llama-3.1-70B-Instruct",
                messages=prompt,
                stream=True,
                max_tokens=2048,
            )
        else:
            # Default to GPT
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
        raise
    except Exception as e:
        error_msg = str(e)
        if "Incorrect API key" in error_msg or "invalid" in error_msg.lower():
            logger.warning("Invalid API key", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=400, detail=f"Invalid API key for {request.model}")
        elif "authentication" in error_msg.lower():
            logger.warning("Authentication failed", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=401, detail=f"Authentication failed for {request.model}")
        else:
            logger.error("Model initialization error", extra={"model": request.model, "user_id": user_id}, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error initializing {request.model}: {error_msg}")

    def event_stream():
        logger.info("AI stream started", extra={"endpoint": "/api/rewrite-message", "user_id": user_id, "model": request.model})
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            logger.info("AI stream completed", extra={"endpoint": "/api/rewrite-message", "user_id": user_id, "model": request.model})
        except Exception as e:
            logger.error("AI stream error", extra={"endpoint": "/api/rewrite-message", "user_id": user_id, "model": request.model}, exc_info=True)
            raise

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Company Research API Endpoint

def build_company_research_prompt(request: CompanyResearchRequest) -> str:
    """Build the user prompt for company research."""
    prompt_parts = [
        f"Please research the following company: **{request.company_name}**",
    ]

    if request.target_role:
        prompt_parts.append(f"\nTarget Role: **{request.target_role}**")
        prompt_parts.append("Please provide role-specific insights tailored to this position.")

    if request.research_focus:
        prompt_parts.append(f"\nSpecific Research Focus: {request.research_focus}")
        prompt_parts.append("Please emphasize these areas in your research.")

    prompt_parts.append("\nProvide comprehensive research following the output structure specified.")

    return "\n".join(prompt_parts)


@app.post("/api/company-research")
def company_research(
    request: CompanyResearchRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Research a company to help with interview preparation"""
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    log_event(user_id, "ai_call", endpoint="/api/company-research", model=request.model)
    logger.info(
        "AI request received",
        extra={
            "endpoint": "/api/company-research",
            "user_id": user_id,
            "model": request.model,
            "company_name": request.company_name,
        },
    )

    user_prompt = build_company_research_prompt(request)
    prompt = [
        {"role": "system", "content": company_research_system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # Select AI model
    try:
        if request.model == "gpt-4o-mini":
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
            api_key = os.getenv("XAI_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="xAI API key not configured")

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
            api_key = os.getenv("HUGGINGFACE_API_KEY")
            if not api_key or api_key.startswith("your_"):
                raise HTTPException(status_code=400, detail="Hugging Face API key not configured")

            hf_client = OpenAI(
                base_url="https://router.huggingface.co/v1",
                api_key=api_key,
            )
            logger.debug(
                "HuggingFace request",
                extra={"model": "meta-llama/Llama-3.1-70B-Instruct", "max_tokens": 4096},
            )
            stream = hf_client.chat.completions.create(
                model="meta-llama/Llama-3.1-70B-Instruct",
                messages=prompt,
                stream=True,
                max_tokens=4096,
            )
        else:
            # Default to GPT
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
        raise
    except Exception as e:
        error_msg = str(e)
        if "Incorrect API key" in error_msg or "invalid" in error_msg.lower():
            logger.warning("Invalid API key", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=400, detail=f"Invalid API key for {request.model}")
        elif "authentication" in error_msg.lower():
            logger.warning("Authentication failed", extra={"model": request.model, "user_id": user_id})
            raise HTTPException(status_code=401, detail=f"Authentication failed for {request.model}")
        else:
            logger.error("Model initialization error", extra={"model": request.model, "user_id": user_id}, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error initializing {request.model}: {error_msg}")

    def event_stream():
        logger.info("AI stream started", extra={"endpoint": "/api/company-research", "user_id": user_id, "model": request.model})
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            logger.info("AI stream completed", extra={"endpoint": "/api/company-research", "user_id": user_id, "model": request.model})
        except Exception as e:
            logger.error("AI stream error", extra={"endpoint": "/api/company-research", "user_id": user_id, "model": request.model}, exc_info=True)
            raise

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Application Tracking Endpoints

@app.post("/api/applications")
def create_application(
    request: ApplicationRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Create a new job application and store it in S3"""
    user_id = creds.decoded["sub"]
    logger.info(
        "Creating application",
        extra={"user_id": user_id, "company_name": request.company_name, "position": request.position},
    )

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
        logger.info(
            "Application created",
            extra={"user_id": user_id, "application_id": application_id, "s3_key": s3_key},
        )
        log_login_if_new(user_id)
        log_event(user_id, "app_create", endpoint="/api/applications",
                  company_name=request.company_name, position=request.position,
                  application_id=application_id)

        return {"message": "Application created successfully", "application": application}

    except ClientError as e:
        logger.error(
            "S3 error creating application",
            extra={"user_id": user_id, "error_code": e.response["Error"]["Code"]},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Failed to store application: {str(e)}")
    except Exception as e:
        logger.error("Error creating application", extra={"user_id": user_id}, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create application: {str(e)}")


@app.get("/api/applications")
def get_applications(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Retrieve all job applications for the authenticated user from S3"""
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    log_event(user_id, "app_read", endpoint="/api/applications")
    logger.info("Fetching applications", extra={"user_id": user_id})

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
            logger.info("Applications retrieved", extra={"user_id": user_id, "count": 0})
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
                logger.warning(
                    "Failed to read application file",
                    extra={"user_id": user_id, "s3_key": obj['Key'], "error": str(e)},
                )
                continue

        # Sort by created_at (newest first)
        applications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        logger.info("Applications retrieved", extra={"user_id": user_id, "count": len(applications)})

        return {"applications": applications}

    except ClientError as e:
        logger.error(
            "S3 error fetching applications",
            extra={"user_id": user_id, "error_code": e.response["Error"]["Code"]},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Failed to retrieve applications: {str(e)}")
    except Exception as e:
        logger.error("Error fetching applications", extra={"user_id": user_id}, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get applications: {str(e)}")


@app.put("/api/applications/{application_id}")
def update_application(
    application_id: str,
    request: ApplicationRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Update an existing job application in S3"""
    user_id = creds.decoded["sub"]
    logger.info(
        "Updating application",
        extra={"user_id": user_id, "application_id": application_id},
    )

    if not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    try:
        # Check if application exists and belongs to user
        s3_key = f"applications/{user_id}/{application_id}.json"

        try:
            existing_obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            existing_app = json.loads(existing_obj['Body'].read().decode('utf-8'))
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                logger.warning(
                    "Application not found",
                    extra={"user_id": user_id, "application_id": application_id},
                )
                raise HTTPException(status_code=404, detail="Application not found")
            raise

        # Update application data
        updated_application = {
            "id": application_id,
            "user_id": user_id,
            "company_name": request.company_name,
            "position": request.position,
            "application_date": request.application_date,
            "status": request.status,
            "notes": request.notes,
            "created_at": existing_app.get("created_at", datetime.now(timezone.utc).isoformat()),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # Store updated application in S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(updated_application),
            ContentType='application/json'
        )
        logger.info(
            "Application updated",
            extra={"user_id": user_id, "application_id": application_id},
        )
        log_login_if_new(user_id)
        log_event(user_id, "app_update", endpoint=f"/api/applications/{application_id}",
                  application_id=application_id)

        return {"message": "Application updated successfully", "application": updated_application}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error updating application",
            extra={"user_id": user_id, "application_id": application_id},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Failed to update application: {str(e)}")


@app.delete("/api/applications/{application_id}")
def delete_application(
    application_id: str,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Delete a job application from S3"""
    user_id = creds.decoded["sub"]
    logger.info(
        "Deleting application",
        extra={"user_id": user_id, "application_id": application_id},
    )

    if not S3_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    try:
        # Delete from S3
        s3_key = f"applications/{user_id}/{application_id}.json"

        try:
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            logger.info(
                "Application deleted",
                extra={"user_id": user_id, "application_id": application_id},
            )
            log_login_if_new(user_id)
            log_event(user_id, "app_delete", endpoint=f"/api/applications/{application_id}",
                      application_id=application_id)
            return {"message": "Application deleted successfully"}
        except ClientError as e:
            logger.error(
                "S3 error deleting application",
                extra={"user_id": user_id, "application_id": application_id, "error_code": e.response["Error"]["Code"]},
                exc_info=True,
            )
            raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error deleting application",
            extra={"user_id": user_id, "application_id": application_id},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")


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
