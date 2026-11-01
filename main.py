import os
import shutil
import tempfile
import time
import re
from collections import defaultdict
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pdf2docx import Converter
import fitz  # PyMuPDF

app = FastAPI(
    title="PaperBytes Core",
    docs_url=None,       # Disables public /docs swagger reconnaissance
    redoc_url=None,
    openapi_url=None
)

# -------------------------------------------------------------
# 1. CORS Configuration
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://adityavardhan123singh-maker.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000"
    ],
    allow_origin_regex=r"https://.*\.github\.io.*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# -------------------------------------------------------------
# 2. Security Headers & Rate Limiting Middleware
# -------------------------------------------------------------
# In-memory sliding window rate limiter: max 5 requests per 60 seconds per IP
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 5
request_history = defaultdict(list)

def get_client_ip(request: Request) -> str:
    """Extract real client IP behind Render/Cloudflare reverse proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    client_ip = get_client_ip(request)
    now = time.time()

    # Enforce rate limiting strictly on conversion endpoints
    if request.url.path.startswith("/convert"):
        # Evict timestamps older than the sliding window
        request_history[client_ip] = [
            ts for ts in request_history[client_ip] if now - ts < RATE_LIMIT_WINDOW
        ]

        if len(request_history[client_ip]) >= MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded. Maximum 5 conversions per minute.",
                    "retry_after_seconds": int(RATE_LIMIT_WINDOW - (now - request_history[client_ip][0]))
                },
                headers={"Retry-After": "60"}
            )

        request_history[client_ip].append(now)

    response: Response = await call_next(request)

    # Attach baseline security headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    return response

# -------------------------------------------------------------
# 3. Ephemeral Workspace Purge Routine
# -------------------------------------------------------------
def purge_ephemeral_workspace(directory_path: str):
    """Guarantees that files in /tmp are erased immediately post-stream."""
    try:
        if os.path.exists(directory_path):
            shutil.rmtree(directory_path, ignore_errors=True)
    except Exception:
        pass

# -------------------------------------------------------------
# 4. Status & Health Endpoints
# -------------------------------------------------------------
@app.get("/")
def ping():
    return {"status": "active", "service": "document-processor"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "paperbytes-core",
        "version": "2.4.0",
        "dpdpa_compliant": True,
        "zero_retention": True
    }

# -------------------------------------------------------------
# 5. Conversion Endpoint (Hardened with PyMuPDF Page Limits)
# -------------------------------------------------------------
@app.post("/convert/pdf-to-docx")
async def convert_pdf_to_docx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # Enforce strict 15MB file size limit to protect RAM
    MAX_SIZE = 15 * 1024 * 1024  # 15 MB
    MAX_PAGES = 30                # Protect Render 512MB RAM from decompression bombs

    header_bytes = await file.read(1024)
    
    # Binary Magic byte check (%PDF-)
    if not header_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload rejected: Not a valid PDF document structure."
        )

    # Isolated temporary workspace
    temp_dir = tempfile.mkdtemp(prefix="paperbytes_")
    input_path = os.path.join(temp_dir, "input.pdf")
    output_path = os.path.join(temp_dir, "output.docx")

    # Ensure cleanup runs after response finishes
    background_tasks.add_task(purge_ephemeral_workspace, temp_dir)

    try:
        # Stream file to disk while enforcing max file size
        total_written = len(header_bytes)
        with open(input_path, "wb") as f:
            f.write(header_bytes)
            while chunk := await file.read(1024 * 512):  # 512KB chunks
                total_written += len(chunk)
                if total_written > MAX_SIZE:
                    purge_ephemeral_workspace(temp_dir)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed limit of 15MB."
                    )
                f.write(chunk)

        # Inspect PDF internal structure with PyMuPDF before heavy conversion
        try:
            doc = fitz.open(input_path)
            if doc.is_encrypted:
                doc.close()
                purge_ephemeral_workspace(temp_dir)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Encrypted or password-protected PDFs cannot be converted to DOCX directly. Please unlock first."
                )

            page_count = len(doc)
            doc.close()

            if page_count == 0:
                purge_ephemeral_workspace(temp_dir)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid PDF: Document contains 0 pages."
                )

            if page_count > MAX_PAGES:
                purge_ephemeral_workspace(temp_dir)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Resource protection: Maximum {MAX_PAGES} pages allowed for free-tier DOCX conversion. (Document has {page_count} pages)."
                )
        except HTTPException:
            raise
        except Exception:
            purge_ephemeral_workspace(temp_dir)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted PDF structure detected."
            )

        # Perform layout reconstruction
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()

        if not os.path.exists(output_path):
            purge_ephemeral_workspace(temp_dir)
            raise HTTPException(status_code=500, detail="Conversion could not generate document.")

        # Sanitize filename against header injection & path traversal
        raw_name = os.path.splitext(file.filename or "converted")[0]
        clean_name = re.sub(r'[^a-zA-Z0-9_\-\s]', '', raw_name).strip() or "converted"
        safe_filename = f"{clean_name}.docx"

        return FileResponse(
            path=output_path,
            filename=safe_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"'
            }
        )

    except HTTPException:
        raise
    except Exception as exc:
        purge_ephemeral_workspace(temp_dir)
        raise HTTPException(status_code=500, detail="Internal processing failure.")
