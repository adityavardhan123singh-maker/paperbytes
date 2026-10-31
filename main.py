import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pdf2docx import Converter

app = FastAPI(
    title="PaperBytes Core",
    docs_url=None,       # Disables public /docs swagger to prevent API reconnaissance
    redoc_url=None,      # Disables public /redoc
    openapi_url=None     # Disables schema inspection
)

# Strict Origin Whitelist (Blocks unauthorized web requests)
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGINS", "https://adityavardhan123singh-maker.github.io")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN.rstrip("/")],
    allow_credentials=False,
    allow_methods=["POST", "GET", "HEAD"],
    allow_headers=["*"],
    max_age=3600,
)

def purge_ephemeral_workspace(directory_path: str):
    """Guarantees that files in /tmp are erased immediately post-stream."""
    try:
        if os.path.exists(directory_path):
            shutil.rmtree(directory_path, ignore_errors=True)
    except Exception:
        pass

@app.get("/")
def ping():
    return {"status": "active", "service": "document-processor"}

@app.post("/convert/pdf-to-docx")
async def convert_pdf_to_docx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # 1. Enforce strict 15MB file size limit to protect RAM
    MAX_SIZE = 15 * 1024 * 1024  # 15 MB
    header_bytes = await file.read(1024)
    
    # 2. Magic byte check (Verifies it is genuinely a PDF)
    if not header_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload rejected: Not a valid PDF document structure."
        )

    # 3. Create isolated, random temporary workspace
    temp_dir = tempfile.mkdtemp(prefix="pb_ephemeral_")
    input_path = os.path.join(temp_dir, "input.pdf")
    output_path = os.path.join(temp_dir, "output.docx")

    # Ensure absolute cleanup when the request finishes
    background_tasks.add_task(purge_ephemeral_workspace, temp_dir)

    try:
        # Write first chunk and stream remainder while enforcing byte limit
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

        # 4. Perform conversion
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()

        if not os.path.exists(output_path):
            purge_ephemeral_workspace(temp_dir)
            raise HTTPException(status_code=500, detail="Conversion could not generate document.")

        safe_filename = os.path.splitext(file.filename or "converted")[0] + ".docx"

        # 5. Return stream directly with ephemeral cleanup hook
        return FileResponse(
            path=output_path,
            filename=safe_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except HTTPException:
        raise
    except Exception as exc:
        purge_ephemeral_workspace(temp_dir)
        raise HTTPException(status_code=500, detail="Internal processing failure.")
