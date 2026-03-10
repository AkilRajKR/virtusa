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
      "patient_name": "Full Name or Unknown",
      "diagnosis": "Primary diagnosis",
      "treatment": "Proposed or actual treatment",
      "dates": ["YYYY-MM-DD", ...],
      "doctor_notes": "Summary of doctor's notes"
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
            "diagnosis": "Could not extract",
            "treatment": "Could not extract",
            "dates": [],
            "doctor_notes": "Extraction failed"
        }
