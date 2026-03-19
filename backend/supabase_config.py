"""
SureCare AI — Supabase Storage & REST API Client
Handles file uploads/downloads to Supabase Storage bucket 'medical-documents'.
Also provides helper for saving analysis records via Supabase REST API.
Uses httpx for async HTTP, with requests fallback for sync operations.
"""
import os
import requests
import logging
from typing import Optional
from dotenv import load_dotenv

from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET

logger = logging.getLogger("surecare.storage")

load_dotenv()


def _headers(content_type: str = "application/json") -> dict:
    """Build Supabase REST headers with service role key."""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
    }


def is_supabase_configured() -> bool:
    """Check if Supabase credentials are present."""
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


# ══════════════════════════════════════════════════════════════
# FILE STORAGE (Supabase Storage)
# ══════════════════════════════════════════════════════════════

def upload_file_to_storage(
    auth_id: str,
    filename: str,
    file_content: bytes,
    content_type: str = "application/pdf",
) -> Optional[str]:
    """
    Upload a file to Supabase Storage bucket.
    Path: medical-documents/{auth_id}/{filename}
    Returns the storage path on success, None on failure.
    """
    if not is_supabase_configured():
        logger.warning("Supabase not configured — skipping storage upload")
        return None

    try:
        # Sanitize filename
        safe_filename = "".join(
            c for c in filename if c.isalnum() or c in "._- "
        ).strip()
        path = f"{auth_id}/{safe_filename}"

        url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{path}"
        headers = _headers(content_type)

        response = requests.post(url, headers=headers, data=file_content)

        # 409 means file already exists — update instead
        if response.status_code == 409:
            logger.info(f"File exists, updating: {path}")
            response = requests.put(url, headers=headers, data=file_content)

        if response.status_code >= 400:
            logger.error(f"Storage upload error {response.status_code}: {response.text}")
            return None

        logger.info(f"Uploaded to storage: {path}")
        return path
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        return None


def get_file_url(auth_id: str, filename: str) -> Optional[str]:
    """Get the public URL for a file in Supabase Storage."""
    if not is_supabase_configured():
        return None

    safe_filename = "".join(
        c for c in filename if c.isalnum() or c in "._- "
    ).strip()
    path = f"{auth_id}/{safe_filename}"
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{path}"


def get_signed_url(auth_id: str, filename: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a signed URL for private file access (expires in seconds)."""
    if not is_supabase_configured():
        return None

    try:
        safe_filename = "".join(
            c for c in filename if c.isalnum() or c in "._- "
        ).strip()
        path = f"{auth_id}/{safe_filename}"

        url = f"{SUPABASE_URL}/storage/v1/object/sign/{SUPABASE_BUCKET}/{path}"
        headers = _headers()
        payload = {"expiresIn": expires_in}

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            signed_url = data.get("signedURL", "")
            if signed_url:
                return f"{SUPABASE_URL}/storage/v1{signed_url}"
        logger.error(f"Signed URL error: {response.status_code} — {response.text}")
        return None
    except Exception as e:
        logger.error(f"Signed URL generation failed: {e}")
        return None


def delete_file(auth_id: str, filename: str) -> bool:
    """Delete a file from Supabase Storage."""
    if not is_supabase_configured():
        return False

    try:
        safe_filename = "".join(
            c for c in filename if c.isalnum() or c in "._- "
        ).strip()
        path = f"{auth_id}/{safe_filename}"

        url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}"
        headers = _headers()
        payload = {"prefixes": [path]}

        response = requests.delete(url, headers=headers, json=payload)
        return response.status_code < 400
    except Exception as e:
        logger.error(f"File delete failed: {e}")
        return False


def list_auth_files(auth_id: str) -> list:
    """List all files in Supabase Storage for a given authorization."""
    if not is_supabase_configured():
        return []

    try:
        url = f"{SUPABASE_URL}/storage/v1/object/list/{SUPABASE_BUCKET}"
        headers = _headers()
        payload = {"prefix": f"{auth_id}/", "limit": 100}

        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        logger.error(f"List files failed: {e}")
        return []


# ══════════════════════════════════════════════════════════════
# DATABASE RECORDS (Supabase REST API — optional sync to cloud)
# ══════════════════════════════════════════════════════════════

def save_analysis_record(
    user_id, filename, approval_status, confidence_score, patient_name, result_data
):
    """
    Saves analysis record to Supabase via REST API (optional cloud sync).
    Primary storage is via SQLAlchemy; this is a secondary sync.
    """
    if not is_supabase_configured():
        logger.debug("Supabase not configured — skipping cloud sync")
        return None

    try:
        url = f"{SUPABASE_URL}/rest/v1/analysis_history"
        headers = _headers()
        headers["Prefer"] = "return=minimal"

        data = {
            "user_id": user_id,
            "filename": filename,
            "approval_status": approval_status,
            "confidence_score": confidence_score,
            "patient_name": patient_name,
            "result_data": result_data,
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code >= 400:
            logger.warning(f"Supabase cloud sync error {response.status_code}: {response.text}")
        else:
            logger.info(f"Cloud sync successful for user {user_id}")

        return response.json() if response.content else {"status": "success"}
    except Exception as e:
        logger.warning(f"Cloud sync failed (non-critical): {e}")
        return None
