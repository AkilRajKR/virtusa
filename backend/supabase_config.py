import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"DEBUG: Supabase Client Initialized with URL: {SUPABASE_URL}")
if not SERVICE_KEY:
    print("DEBUG: ERROR - SUPABASE_SERVICE_ROLE_KEY is missing!")

def save_analysis_record(user_id, filename, approval_status, confidence_score, patient_name, result_data):
    """
    Saves analysis record using direct Supabase REST API (stable alternative to SDK).
    """
    try:
        url = f"{SUPABASE_URL}/rest/v1/analysis_history"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        data = {
            "user_id": user_id,
            "filename": filename,
            "approval_status": approval_status,
            "confidence_score": confidence_score,
            "patient_name": patient_name,
            "result_data": result_data
        }
        print(f"Pinging Supabase REST: {url}")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code >= 400:
            print(f"Supabase Error {response.status_code}: {response.text}")
        else:
            print(f"Successfully saved record to Supabase history for user {user_id}")
            
        response.raise_for_status()
        return response.json() if response.content else {"status": "success"}
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
        return None

def upload_file_to_storage(user_id, file_name, file_content):
    """
    Uploads file to Supabase Storage using direct REST API.
    """
    try:
        # Sanitize filename
        safe_filename = "".join([c for c in file_name if c.isalnum() or c in "._- "]).strip()
        path = f"{user_id}/{safe_filename}"
        
        # Supabase Storage REST API Endpoint
        # POST /storage/v1/object/{bucket}/{path}
        url = f"{SUPABASE_URL}/storage/v1/object/clinical-docs/{path}"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/pdf" # Assuming PDF based on previous context
        }
        
        response = requests.post(url, headers=headers, data=file_content)
        # 409 means file already exists, which is fine
        if response.status_code == 409:
            print(f"File {path} already exists in storage.")
            return path
            
        response.raise_for_status()
        return path
    except Exception as e:
        print(f"Error uploading file to Supabase Storage: {e}")
        return None
