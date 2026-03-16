import google.generativeai as genai
import json
import os
from typing import Dict, Any

def extract_clinical_data(text: str) -> Dict[str, Any]:
    """
    Extract structured medical data from patient document text.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert clinical data extractor.
    Analyze the following medical text and extract the key information into a strict JSON format.
    
    Output JSON format MUST be exactly:
    {{
      "patient_name": "Full Name",
      "patient_id": "ID String (e.g. MRN-123)",
      "dob": "YYYY-MM-DD",
      "gender": "Male/Female/Other",
      "facility_name": "Hospital/Clinic Name",
      "requesting_provider": "Doctor Name",
      "diagnosis": "Primary medical diagnosis",
      "treatment": "Proposed procedure or medication",
      "icd_codes": ["code1", "code2"],
      "cpt_codes": ["code1", "code2"],
      "dates": ["YYYY-MM-DD"],
      "doctor_notes": "Concise summary",
      "clinical_rationale": "Comprehensive breakdown of the medical necessity as stated in the text.",
      "risk_factors": ["List of identified patient risks"]
    }}
    
    Do not include any Markdown formatting (like `json) in your output, just the raw JSON string.
    
    Medical Text:
    {text}
    """
    
    response = model.generate_content(prompt)
    
    try:
        # Strip potential markdown formatting if model ignores instruction
        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]
            
        data = json.loads(res_text.strip())
        return data
    except Exception as e:
        print(f"JSON Parsing Error in Clinical Reader Agent: {e}")
        # Return fallback structured data
        return {
            "patient_name": "Unknown",
            "patient_id": "N/A",
            "dob": "Unknown",
            "gender": "Unknown",
            "facility_name": "Unknown",
            "requesting_provider": "Unknown",
            "diagnosis": "Could not extract",
            "treatment": "Could not extract",
            "icd_codes": [],
            "cpt_codes": [],
            "dates": [],
            "doctor_notes": "Extraction failed",
            "clinical_rationale": "Extraction failed",
            "risk_factors": []
        }
