import os
import base64
import io
import json
import time
import uuid
import threading
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
from saas.prompts.ats_scorer_prompt import ats_scorer_system_prompt
from saas.logger import setup_logging, get_logger, correlation_id_var
from saas.analytics import log_event, log_login_if_new
from tavily import TavilyClient
from typing import Literal
from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

load_dotenv()
setup_logging()
logger = get_logger("api")


def _log_event_bg(user_id: str, event_type: str, **kwargs) -> None:
    """Fire log_event in a daemon thread so it never blocks the request path."""
    threading.Thread(
        target=log_event,
        args=(user_id, event_type),
        kwargs=kwargs,
        daemon=True,
    ).start()

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
    resume_pdf: str | None = None
    linkedin_profile_pdf: str | None = None
    resume_filename: str | None = None
    linkedin_filename: str | None = None
    job_description: str | None = None
    additional_notes: str
    model: str


class ATSScoreRequest(BaseModel):
    resume_text: str | None = None          # plain text/markdown — for re-scoring generated resume
    resume_pdf: str | None = None           # base64 PDF — for Step 1 original upload or if user prefers PDF upload over text input
    resume_filename: str | None = None
    linkedin_profile_pdf: str | None = None
    linkedin_filename: str | None = None
    job_description: str | None = None
    role_applied_for: str | None = None
    model: str = "gpt-4o-mini"             # accepted but ignored — scoring always uses gpt-4o-mini for json_object mode


class RoadmapRequest(BaseModel):
    current_job_title: str
    time_to_prep_in_months: int
    role_applied_for: str
    resume_pdf: str | None = None
    linkedin_profile_pdf: str | None = None
    resume_filename: str | None = None
    linkedin_filename: str | None = None
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
    

## Hybrid file parsing: PyPDF2 for text-based PDFs, GPT-4o-mini Vision OCR for scanned PDFs and images

_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"}
_MIME_MAP = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "bmp": "image/bmp", "tiff": "image/tiff",
}


def extract_text_with_ocr(file_bytes: bytes, filename: str | None = None) -> str:
    """
    Extract text from a PDF or image file using GPT-4o-mini Vision OCR.

    For PDFs: each page is rendered to a PNG via PyMuPDF and sent to the vision model.
    For images (jpg/png/etc.): the raw bytes are sent directly to the vision model.

    Args:
        file_bytes: Raw bytes of the file (PDF or image)
        filename:   Original filename, used to detect the file type

    Returns:
        Extracted text, one page per block joined with double newlines
    """
    import fitz  # PyMuPDF

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("your_"):
        raise HTTPException(status_code=400, detail="OpenAI API key not configured for OCR")
    client = OpenAI(api_key=api_key)

    ext = (filename or "").lower().rsplit(".", 1)[-1]
    is_image = ext in _IMAGE_EXTENSIONS

    if is_image:
        # Direct image upload — send base64 straight to the vision model
        mime = _MIME_MAP.get(ext, "image/jpeg")
        pages_b64 = [(base64.b64encode(file_bytes).decode("utf-8"), mime)]
        logger.debug("OCR: image input detected", extra={"ext": ext})
    else:
        # PDF — render each page to PNG at 2× zoom for legibility
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        logger.debug("OCR: PDF opened", extra={"page_count": doc.page_count})
        pages_b64 = []
        for page_num in range(doc.page_count):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            pages_b64.append((base64.b64encode(pix.tobytes("png")).decode("utf-8"), "image/png"))
        doc.close()

    all_text: list[str] = []
    for i, (img_b64, mime) in enumerate(pages_b64):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract all text from this document page exactly as it appears. "
                            "Preserve the structure, bullet points, section headings, and formatting. "
                            "Return only the extracted text with no additional commentary."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{img_b64}",
                            "detail": "high",
                        },
                    },
                ],
            }],
            max_tokens=2048,
        )
        page_text = response.choices[0].message.content
        all_text.append(page_text)
        logger.debug("OCR page extracted", extra={"page": i + 1, "char_count": len(page_text)})

    full_text = "\n\n".join(all_text)
    logger.debug("OCR extraction complete", extra={"total_chars": len(full_text)})
    return full_text


def parse_file_content(base64_file: str, filename: str | None = None) -> str:
    """
    Hybrid file parser. Strategy:
    - Image files (.jpg, .png, etc.) → OCR via GPT-4o-mini Vision directly.
    - PDFs → try PyPDF2 text extraction first (fast, free).
              If extracted text is sparse (<200 chars, likely a scanned PDF),
              fall back to OCR via GPT-4o-mini Vision.

    Args:
        base64_file: Base64-encoded file content
        filename:    Original filename (used to detect images vs PDFs)

    Returns:
        Extracted text string
    """
    try:
        file_bytes = base64.b64decode(base64_file)
        ext = (filename or "").lower().rsplit(".", 1)[-1]

        if ext in _IMAGE_EXTENSIONS:
            logger.debug("parse_file_content: image detected, using OCR", extra={"ext": ext})
            return extract_text_with_ocr(file_bytes, filename)

        # PDF path — attempt PyPDF2 first
        try:
            pdf_reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = [page.extract_text() or "" for page in pdf_reader.pages]
            full_text = "\n\n".join(t for t in text_parts if t.strip())
            if len(full_text.strip()) >= 200:
                logger.debug("parse_file_content: PyPDF2 succeeded", extra={"char_count": len(full_text)})
                return full_text
            logger.debug("parse_file_content: PyPDF2 text sparse, falling back to OCR",
                         extra={"char_count": len(full_text.strip())})
        except Exception:
            logger.debug("parse_file_content: PyPDF2 failed, falling back to OCR")

        return extract_text_with_ocr(file_bytes, filename)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("parse_file_content failed", extra={"error_type": type(e).__name__}, exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")







def user_prompt_for(request: ResumeRequest) -> str:
    prompt_parts = [
        "Create a professional resume for:",
        f"Applicant Name: {request.applicant_name}",
        f"Application Date: {request.application_date}",
        f"Role Applied For: {request.role_applied_for}",
    ]

    # Add existing resume content if PDF/image was uploaded
    if request.resume_pdf:
        pdf_content = parse_file_content(request.resume_pdf, request.resume_filename)
        prompt_parts.extend([
            "",
            "=== EXISTING RESUME CONTENT ===",
            pdf_content,
            "=== END OF EXISTING RESUME ===",
            "",
            "Please use the above existing resume as a reference and improve it for the role applied for."
        ])

    if request.linkedin_profile_pdf:
        linkedin_pdf_content = parse_file_content(request.linkedin_profile_pdf, request.linkedin_filename)
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

    if request.job_description:
        prompt_parts.extend([
            "",
            "=== JOB DESCRIPTION (HIGH PRIORITY — tailor resume to match this) ===",
            request.job_description,
            "=== END OF JOB DESCRIPTION ===",
            "",
            "CRITICAL: Use the job description above as the primary tailoring guide. "
            "Mirror its exact keywords, prioritise matching skills, and rewrite experience "
            "bullets to directly address the responsibilities and requirements listed."
        ])

    # Add additional notes
    prompt_parts.extend([
        "",
        "Additional Instructions from Applicant:",
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

    # Add existing resume content if PDF/image was uploaded
    if request.resume_pdf:
        pdf_content = parse_file_content(request.resume_pdf, request.resume_filename)
        prompt_parts.extend([
            "",
            "=== CURRENT RESUME/BACKGROUND ===",
            pdf_content,
            "=== END OF RESUME ===",
            "",
            "Please analyze the above resume to understand the candidate's current skills and experience."
        ])

    # Add LinkedIn profile content if PDF/image was uploaded
    if request.linkedin_profile_pdf:
        linkedin_pdf_content = parse_file_content(request.linkedin_profile_pdf, request.linkedin_filename)
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


def build_ats_score_prompt(request: ATSScoreRequest, resume_text: str, linkedin_text: str | None) -> str:
    parts = ["Score the following resume for ATS compatibility."]
    if request.role_applied_for:
        parts.append(f"Target Role: {request.role_applied_for}")
    parts += ["", "=== RESUME CONTENT ===", resume_text, "=== END OF RESUME ==="]
    if linkedin_text:
        parts += [
            "",
            "=== LINKEDIN PROFILE (supplementary context) ===",
            linkedin_text,
            "=== END OF LINKEDIN ===",
        ]
    if request.job_description:
        parts += [
            "",
            "=== JOB DESCRIPTION ===",
            request.job_description,
            "=== END OF JOB DESCRIPTION ===",
        ]
    else:
        parts += [
            "",
            "NOTE: No job description was provided. Set keyword_matching.score = 0 and keyword_matching.max = 0. "
            "Score only structural and formatting quality for the remaining categories.",
        ]
    return "\n".join(parts)


# API endpoint for ATS scoring
@app.post("/api/ats-score")
def ats_score(
    request: ATSScoreRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    _log_event_bg(
        user_id, "ai_call",
        endpoint="/api/ats-score",
        model="gpt-4o-mini",
        has_resume_pdf=bool(request.resume_pdf),
        has_resume_text=bool(request.resume_text),
        has_job_description=bool(request.job_description),
        role_applied_for=request.role_applied_for or "",
    )
    logger.info(
        "ATS score request received",
        extra={"endpoint": "/api/ats-score", "user_id": user_id},
    )

    if not request.resume_text and not request.resume_pdf:
        raise HTTPException(status_code=422, detail="Either resume_text or resume_pdf is required")

    if request.resume_text:
        resume_text = request.resume_text
    else:
        resume_text = parse_file_content(request.resume_pdf, request.resume_filename)

    linkedin_text = None
    if request.linkedin_profile_pdf:
        linkedin_text = parse_file_content(request.linkedin_profile_pdf, request.linkedin_filename)

    user_prompt = build_ats_score_prompt(request, resume_text, linkedin_text)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("your_"):
        raise HTTPException(status_code=400, detail="OpenAI API key not configured")

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ats_scorer_system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=2000,
    )

    raw_json = response.choices[0].message.content
    try:
        result = json.loads(raw_json)
    except json.JSONDecodeError:
        logger.error("ATS score JSON parse failed", extra={"user_id": user_id, "raw": raw_json[:500]})
        raise HTTPException(status_code=500, detail="ATS scoring returned invalid JSON")

    required_keys = {"overall_score", "categories", "red_flags", "top_improvements"}
    if not required_keys.issubset(result.keys()):
        logger.error("ATS score response missing required keys", extra={"user_id": user_id, "keys": list(result.keys())})
        raise HTTPException(status_code=500, detail="ATS scoring response was malformed")

    _log_event_bg(
        user_id, "ai_response",
        endpoint="/api/ats-score",
        model="gpt-4o-mini",
        overall_score=result.get("overall_score"),
        has_job_description=bool(request.job_description),
    )
    logger.info("ATS score completed", extra={"user_id": user_id, "overall_score": result.get("overall_score")})
    return result


# API endpoint for resume consultation
@app.post("/api/consultation")
def consultation_summary(
    request: ResumeRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    _log_event_bg(
        user_id, "ai_call",
        endpoint="/api/consultation",
        model=request.model,
        applicant_name=request.applicant_name,
        role_applied_for=request.role_applied_for,
        job_description=(request.job_description or "")[:2000],
        additional_notes=request.additional_notes or "",
        has_resume_pdf=bool(request.resume_pdf),
        has_linkedin_pdf=bool(request.linkedin_profile_pdf),
    )
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
        full_response_parts: list[str] = []
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    full_response_parts.append(text)
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            full_response = "".join(full_response_parts)
            logger.info("AI stream completed", extra={"endpoint": "/api/consultation", "user_id": user_id, "model": request.model, "response_chars": len(full_response)})
            _log_event_bg(
                user_id, "ai_response",
                endpoint="/api/consultation",
                model=request.model,
                response_text=full_response[:100_000],
                response_char_count=len(full_response),
            )
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
    log_event(
        user_id, "ai_call",
        endpoint="/api/roadmap_consultation",
        model=request.model,
        current_job_title=request.current_job_title,
        role_applied_for=request.role_applied_for,
        time_to_prep_in_months=request.time_to_prep_in_months,
        additional_notes=request.additional_notes or "",
        has_resume_pdf=bool(request.resume_pdf),
        has_linkedin_pdf=bool(request.linkedin_profile_pdf),
    )
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
        full_response_parts: list[str] = []
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    full_response_parts.append(text)
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            full_response = "".join(full_response_parts)
            logger.info("AI stream completed", extra={"endpoint": "/api/roadmap_consultation", "user_id": user_id, "model": request.model, "response_chars": len(full_response)})
            log_event(
                user_id, "ai_response",
                endpoint="/api/roadmap_consultation",
                model=request.model,
                response_text=full_response[:100_000],
                response_char_count=len(full_response),
            )
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
    log_event(
        user_id, "ai_call",
        endpoint="/api/rewrite-message",
        model=request.model,
        original_message=request.original_message[:5000],
        message_type=request.message_type,
        formality_level=request.formality_level,
        recipient_type=request.recipient_type,
        additional_context=request.additional_context or "",
    )
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
        full_response_parts: list[str] = []
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    full_response_parts.append(text)
                    lines = text.split("\n")
                    for line in lines[:-1]:
                        yield f"data: {line}\n\n"
                        yield "data:  \n"
                    yield f"data: {lines[-1]}\n\n"
            full_response = "".join(full_response_parts)
            logger.info("AI stream completed", extra={"endpoint": "/api/rewrite-message", "user_id": user_id, "model": request.model, "response_chars": len(full_response)})
            log_event(
                user_id, "ai_response",
                endpoint="/api/rewrite-message",
                model=request.model,
                response_text=full_response[:100_000],
                response_char_count=len(full_response),
            )
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

# --- Deep research agent setup ---

tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def web_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "sports", "news", "finance"] = "general",
    include_raw_content: bool = False,
):
    """Run a web search via Tavily."""
    return tavily_client.search(
        query,
        max_results=max_results,
        include_raw_content=include_raw_content,
        topic=topic,
    )

research_instructions = """\
You are an expert researcher. Your job is to conduct \
thorough research, and then write a polished report. \
"""

# In-memory store for background research tasks.
# Keys are task UUIDs; values are dicts with status/content/error.
_research_tasks: dict = {}


def _resolve_chat_model(model: str) -> ChatOpenAI:
    """Return a ChatOpenAI instance for the requested model string."""
    if model == "gpt-4o-mini":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        return ChatOpenAI(model="gpt-4o-mini", api_key=api_key)
    elif model == "grok-beta":
        api_key = os.getenv("XAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="xAI API key not configured")
        return ChatOpenAI(
            model="llama-3.3-70b-versatile",
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key,
        )
    elif model == "llama-70b":
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="Hugging Face API key not configured")
        return ChatOpenAI(
            model="meta-llama/Llama-3.1-70B-Instruct",
            base_url="https://router.huggingface.co/v1",
            api_key=api_key,
        )
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        return ChatOpenAI(model="gpt-4o-mini", api_key=api_key)


def _run_simple_research(request: CompanyResearchRequest, user_prompt: str) -> str:
    """
    Fallback research path for Grok / Llama models that cannot handle deepagents'
    complex multi-tool schemas (they emit XML tool syntax and fail with tool_use_failed).

    Strategy: run several targeted Tavily searches, aggregate the raw results as
    context, then ask the LLM to synthesise a report — no tool calling involved.
    """
    company = request.company_name
    role = request.target_role or "general role"

    queries = [
        f"{company} company overview mission values culture",
        f"{company} {role} interview process hiring tips",
        f"{company} recent news 2024 2025",
        f"{company} engineering culture tech stack",
        f"{company} employee reviews salary compensation",
    ]

    search_results: list[str] = []
    for q in queries:
        try:
            result = web_search(q, max_results=3)
            # Tavily returns a dict; stringify just the results list for brevity
            results_list = result.get("results", result) if isinstance(result, dict) else result
            search_results.append(f"Query: {q}\n{json.dumps(results_list, indent=2)}")
        except Exception as exc:
            logger.warning("Tavily search failed", extra={"query": q, "error": str(exc)})

    context = "\n\n---\n\n".join(search_results) if search_results else "No search results available."

    synthesis_prompt = (
        f"{user_prompt}\n\n"
        "=== WEB RESEARCH DATA ===\n"
        f"{context}\n"
        "=== END OF RESEARCH DATA ===\n\n"
        "Using the research data above, write a comprehensive company research report "
        "covering: company overview, culture, recent news, role-specific interview tips, "
        "compensation, and any other relevant insights."
    )

    # Route to the correct non-GPT client (no tool schemas, plain chat completion)
    if request.model == "grok-beta":
        api_key = os.getenv("XAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="xAI API key not configured")
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)
        model_name = "llama-3.3-70b-versatile"
    elif request.model == "llama-70b":
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="Hugging Face API key not configured")
        client = OpenAI(base_url="https://router.huggingface.co/v1", api_key=api_key)
        model_name = "meta-llama/Llama-3.1-70B-Instruct"
    else:
        # Fallback to GPT if model is unrecognised
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")
        client = OpenAI(api_key=api_key)
        model_name = "gpt-4o-mini"

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": research_instructions},
            {"role": "user", "content": synthesis_prompt},
        ],
        max_tokens=4096,
    )
    return response.choices[0].message.content


@app.post("/api/company-research")
def company_research(
    request: CompanyResearchRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """
    Start a background deep-research task and return a task_id immediately.
    The client should poll GET /api/research-status/{task_id} until done.
    This avoids HTTP proxy timeouts for the 2-5 minute agent run.

    GPT-4o-mini  → deepagents (multi-step web search agent)
    Grok / Llama → simple Tavily search + direct LLM synthesis
                   (these models fail with deepagents' complex tool schemas)
    """
    user_id = creds.decoded["sub"]
    log_login_if_new(user_id)
    log_event(
        user_id, "ai_call",
        endpoint="/api/company-research",
        model=request.model,
        company_name=request.company_name,
        target_role=request.target_role or "",
        research_focus=request.research_focus or "",
    )
    logger.info(
        "Company research task submitted",
        extra={"user_id": user_id, "model": request.model, "company": request.company_name},
    )

    user_prompt = build_company_research_prompt(request)
    task_id = str(uuid.uuid4())
    _research_tasks[task_id] = {"status": "running", "content": None, "error": None}

    # Build deep agent only for GPT-4o-mini; Grok/Llama use the simple path
    agent = None
    if request.model == "gpt-4o-mini":
        chat_model = _resolve_chat_model(request.model)
        agent = create_deep_agent(
            model=chat_model,
            tools=[web_search],
            system_prompt=research_instructions,
        )

    def run_agent():
        try:
            if agent is not None:
                # Deep agent path (GPT-4o-mini)
                result = agent.invoke({"messages": [{"role": "user", "content": user_prompt}]})
                content = result["messages"][-1].content
            else:
                # Simple Tavily + LLM path (Grok / Llama)
                content = _run_simple_research(request, user_prompt)
            _research_tasks[task_id]["content"] = content
            _research_tasks[task_id]["status"] = "done"
            logger.info("Company research task completed", extra={"task_id": task_id, "user_id": user_id, "response_chars": len(content)})
            log_event(
                user_id, "ai_response",
                endpoint="/api/company-research",
                model=request.model,
                company_name=request.company_name,
                target_role=request.target_role or "",
                response_text=content[:100_000],
                response_char_count=len(content),
            )
        except Exception as exc:
            _research_tasks[task_id]["error"] = str(exc)
            _research_tasks[task_id]["status"] = "failed"
            logger.error("Company research task failed", extra={"task_id": task_id, "user_id": user_id}, exc_info=True)

    threading.Thread(target=run_agent, daemon=True).start()
    return {"task_id": task_id}


@app.get("/api/research-status/{task_id}")
def research_status(
    task_id: str,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    """Poll this endpoint after POST /api/company-research to check task progress."""
    task = _research_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


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
