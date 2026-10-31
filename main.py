import os
import time
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz
from pdf2docx import Converter

TEMP_DIR = Path("/tmp/omniconvert_secure") if os.name != "nt" else Path("temp_omniconvert_secure")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 35 * 1024 * 1024
MAX_PAGE_COUNT = 30
STALE_FILE_MAX_AGE_SEC = 600

APP_SECRET = os.getenv("CONVERTX_APP_SECRET", "convertx-prod-key-2026")
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

def purge_path(path_str: str):
    try:
        p = Path(path_str)
        if p.exists():
            p.unlink()
    except Exception as e:
        print(f"[Purge Error] {e}")

def sweep_stale_files():
    now = time.time()
    for item in TEMP_DIR.glob("*"):
        if item.is_file() and (now - item.stat().st_mtime) > STALE_FILE_MAX_AGE_SEC:
            item.unlink(missing_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    sweep_stale_files()
    yield
    sweep_stale_files()

app = FastAPI(title="CONVERTx Backend Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "online", "service": "CONVERTx Backend"}

@app.post("/convert/pdf-to-docx")
async def convert_pdf_to_docx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_api_key: str = Header(None, alias="x-api-key")
):
    if not x_api_key or x_api_key != APP_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")

    header = await file.read(1024)
    if not header.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid signature: Not a valid PDF.")

    remaining = await file.read()
    total_size = len(header) + len(remaining)
    if total_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 35 MB size limit.")

    job_id = str(uuid.uuid4())
    input_path = TEMP_DIR / f"{job_id}_in.pdf"
    output_path = TEMP_DIR / f"{job_id}_out.docx"

    with open(input_path, "wb") as f:
        f.write(header)
        f.write(remaining)

    try:
        doc = fitz.open(str(input_path))
        page_count = doc.page_count
        doc.close()
    except Exception:
        purge_path(str(input_path))
        raise HTTPException(status_code=400, detail="Malformed PDF.")

    if page_count > MAX_PAGE_COUNT:
        purge_path(str(input_path))
        raise HTTPException(status_code=400, detail=f"Page count ({page_count}) exceeds limit of {MAX_PAGE_COUNT}.")

    try:
        cv = Converter(str(input_path))
        cv.convert(str(output_path), start=0, end=None)
        cv.close()

        background_tasks.add_task(purge_path, str(input_path))
        background_tasks.add_task(purge_path, str(output_path))

        safe_name = Path(file.filename).stem[:40].replace(" ", "_")
        return FileResponse(
            str(output_path),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"{safe_name}.docx"
        )
    except Exception as e:
        purge_path(str(input_path))
        purge_path(str(output_path))
        raise HTTPException(status_code=500, detail=str(e))