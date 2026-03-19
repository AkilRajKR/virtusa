"""
SureCare AI — Document Service
Coordinates the document lifecycle: Upload → OCR → Structure → Store.
Manages document records in the database and files in Supabase Storage.
"""
import os
import json
import logging
import datetime
from typing import Optional, List

from database import SessionLocal, Document
from supabase_config import upload_file_to_storage, get_file_url, get_signed_url
from ocr_service import extract_text, structure_ocr_output
from config import UPLOAD_DIR

logger = logging.getLogger("surecare.documents")


# MIME type mapping
CONTENT_TYPES = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def process_document(
    auth_id: str,
    file_content: bytes,
    filename: str,
    file_type: str,
    uploaded_by: int,
    uploader_role: str,
    db=None,
) -> dict:
    """
    Full document processing pipeline:
    1. Upload raw file to Supabase Storage (or save locally)
    2. Run OCR/text extraction
    3. Structure the OCR output via Gemini
    4. Save Document record to DB
    5. Return document info
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        file_type = file_type.lower().strip(".")

        # ── Step 1: Upload to storage ──────────────────────
        content_type = CONTENT_TYPES.get(file_type, "application/octet-stream")

        storage_path = upload_file_to_storage(
            auth_id=auth_id,
            filename=filename,
            file_content=file_content,
            content_type=content_type,
        )

        # Fallback: save locally if Supabase Storage unavailable
        if not storage_path:
            local_dir = os.path.join(UPLOAD_DIR, auth_id)
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, filename)
            with open(local_path, "wb") as f:
                f.write(file_content)
            file_url = f"/uploads/{auth_id}/{filename}"
            logger.info(f"Saved locally: {local_path}")
        else:
            file_url = get_file_url(auth_id, filename) or storage_path

        # ── Step 2: OCR extraction ─────────────────────────
        ocr_text = extract_text(file_content, file_type)

        # ── Step 3: Structure via Gemini ───────────────────
        structured_data = {}
        if ocr_text and len(ocr_text.strip()) > 20:
            structured_data = structure_ocr_output(ocr_text)

        # ── Step 4: Save document record ───────────────────
        doc_record = Document(
            auth_id=auth_id,
            uploaded_by=uploaded_by,
            uploader_role=uploader_role,
            original_filename=filename,
            file_url=file_url,
            file_type=file_type,
            file_size_bytes=len(file_content),
            ocr_text=ocr_text,
            structured_data=json.dumps(structured_data, default=str) if structured_data else None,
            verified=False,
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        logger.info(f"Document processed: {doc_record.id} ({filename}, {file_type}, {len(file_content)} bytes)")

        # ── Step 5: Return info ────────────────────────────
        return {
            "document_id": doc_record.id,
            "auth_id": auth_id,
            "filename": filename,
            "file_url": file_url,
            "file_type": file_type,
            "file_size_bytes": len(file_content),
            "ocr_text_preview": ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text,
            "ocr_text_length": len(ocr_text),
            "structured_data": structured_data,
            "verified": False,
            "created_at": doc_record.created_at.isoformat() if doc_record.created_at else "",
        }

    except Exception as e:
        logger.error(f"Document processing failed: {e}", exc_info=True)
        raise
    finally:
        if close_db:
            db.close()


def get_documents_for_auth(auth_id: str, db=None) -> List[dict]:
    """Fetch all documents for a given authorization."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        docs = db.query(Document).filter(
            Document.auth_id == auth_id
        ).order_by(Document.created_at.desc()).all()

        return [
            {
                "document_id": doc.id,
                "auth_id": doc.auth_id,
                "filename": doc.original_filename,
                "file_url": doc.file_url,
                "file_type": doc.file_type,
                "file_size_bytes": doc.file_size_bytes,
                "ocr_text_preview": doc.ocr_text[:300] + "..." if doc.ocr_text and len(doc.ocr_text) > 300 else (doc.ocr_text or ""),
                "structured_data": json.loads(doc.structured_data) if doc.structured_data else None,
                "verified": doc.verified,
                "uploaded_by": doc.uploaded_by,
                "uploader_role": doc.uploader_role,
                "created_at": doc.created_at.isoformat() if doc.created_at else "",
            }
            for doc in docs
        ]
    finally:
        if close_db:
            db.close()


def verify_document(document_id: int, db=None) -> dict:
    """Mark a document as verified by a doctor/admin."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return {"error": "Document not found"}

        doc.verified = True
        db.commit()

        return {
            "document_id": doc.id,
            "verified": True,
            "message": "Document verified successfully",
        }
    finally:
        if close_db:
            db.close()


def get_combined_text_for_auth(auth_id: str, db=None) -> str:
    """
    Get combined OCR text from all verified documents for an authorization.
    Useful for re-running the AI pipeline with updated documents.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        docs = db.query(Document).filter(
            Document.auth_id == auth_id,
            Document.verified == True
        ).order_by(Document.created_at.asc()).all()

        if not docs:
            # Fall back to all documents if none are verified
            docs = db.query(Document).filter(
                Document.auth_id == auth_id
            ).order_by(Document.created_at.asc()).all()

        texts = [doc.ocr_text for doc in docs if doc.ocr_text]
        return "\n\n---\n\n".join(texts)
    finally:
        if close_db:
            db.close()


def get_combined_structured_data(auth_id: str, db=None) -> dict:
    """
    Merge structured data from all verified documents for an authorization.
    Later documents override earlier ones for duplicate keys.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        docs = db.query(Document).filter(
            Document.auth_id == auth_id,
            Document.verified == True
        ).order_by(Document.created_at.asc()).all()

        if not docs:
            docs = db.query(Document).filter(
                Document.auth_id == auth_id
            ).order_by(Document.created_at.asc()).all()

        merged = {}
        for doc in docs:
            if doc.structured_data:
                try:
                    data = json.loads(doc.structured_data)
                    # Merge: later values overwrite, lists are extended
                    for key, value in data.items():
                        if key.startswith("_"):
                            continue
                        if isinstance(value, list) and isinstance(merged.get(key), list):
                            # Extend lists, removing duplicates
                            existing = set(str(v) for v in merged[key])
                            merged[key].extend(v for v in value if str(v) not in existing)
                        elif value and value != "Unknown" and value != "N/A":
                            merged[key] = value
                except json.JSONDecodeError:
                    continue

        return merged
    finally:
        if close_db:
            db.close()
