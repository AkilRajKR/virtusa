import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import io
import os
from dotenv import load_dotenv

load_dotenv()

from clinical_reader_agent import extract_clinical_data
from evidence_builder_agent import validate_evidence
from policy_intelligence_agent import compare_against_policy
from supabase_config import save_analysis_record, upload_file_to_storage

app = FastAPI(title="AI Prior Authorization System")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

@app.post("/api/analyze")
async def analyze_document(file: UploadFile = File(...), user_id: str = "anonymous"):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
            
        logging.info("Extracted text from PDF")
        
        # 1. Clinical Data Extraction
        clinical_data = extract_clinical_data(text)
        logging.info(f"Extracted clinical data: {clinical_data}")
        
        # 2. Evidence Validation
        evidence_data = validate_evidence(clinical_data, text)
        logging.info(f"Validated evidence: {evidence_data}")
        
        # 3. Policy Intelligence
        policy_data = compare_against_policy(clinical_data, evidence_data)
        logging.info(f"Policy evaluation: {policy_data}")
        
        # 4. Decision Logic
        missing_info = evidence_data.get("missing_documents", []) + policy_data.get("violations", [])
        
        if not evidence_data.get("diagnosis_supported", False) or not evidence_data.get("treatment_supported", False) or not policy_data.get("policy_match", False):
            approval_status = "REJECTED"
            confidence_score = 40 + min(len(missing_info) * 10, 20)  # Randomish range 40-60
            if confidence_score > 60: confidence_score = 60
        else:
            approval_status = "APPROVED"
            confidence_score = 85 + min(10, max(0, 10 - len(missing_info))) # Randomish range 85-95
            
        final_result = {
            "approval_status": approval_status,
            "confidence_score": confidence_score,
            "missing_information": missing_info,
            "summary": "Document successfully analyzed across our 3 AI agent nodes.",
            "details": {
                "clinical_data": clinical_data,
                "evidence_data": evidence_data,
                "policy_data": policy_data
            }
        }
        
        # 5. Persist to Supabase
        # Upload file to storage
        storage_path = upload_file_to_storage(user_id, file.filename, content)
        logging.info(f"File uploaded to storage: {storage_path}")
        
        # Save analysis history
        history_res = save_analysis_record(
            user_id=user_id,
            filename=file.filename,
            approval_status=approval_status,
            confidence_score=confidence_score,
            patient_name=clinical_data.get("patient_name", "Unknown"),
            result_data=final_result
        )
        if history_res:
            logging.info(f"Analysis record successfully registered for user {user_id}")
        else:
            logging.error(f"Failed to register analysis record for user {user_id}")

        return final_result
        
    except Exception as e:
        logging.error(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("analysis_agent:app", host="0.0.0.0", port=8000, reload=True)
