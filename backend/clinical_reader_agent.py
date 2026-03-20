<<<<<<< HEAD
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
=======
"""
SureCare AI — Clinical Reader Agent
Extracts structured medical data from unstructured clinical notes using Gemini LLM
with regex fallback for robustness.
"""
import google.generativeai as genai
import json
import re
import time
from typing import Dict, Any

from config import GEMINI_MODEL


def extract_clinical_data(text: str) -> Dict[str, Any]:
    """
    Extract structured medical data from patient document text.
    Uses Gemini LLM with regex fallback.
    """
    start_time = time.time()
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""You are an expert clinical data extractor for a healthcare prior authorization system.
Analyze the following medical text and extract all key information into strict JSON format.

Output JSON format MUST be exactly:
{{
  "patient_name": "Full Name",
  "patient_id": "ID String (e.g. MRN-123)",
  "dob": "YYYY-MM-DD",
  "gender": "Male/Female/Other",
  "facility_name": "Hospital/Clinic Name",
  "requesting_provider": "Doctor Name with credentials",
  "diagnosis": "Primary medical diagnosis",
  "treatment": "Proposed procedure or medication",
  "icd_codes": ["code1", "code2"],
  "cpt_codes": ["code1", "code2"],
  "dates": ["YYYY-MM-DD"],
  "doctor_notes": "Concise clinical summary",
  "clinical_rationale": "Comprehensive breakdown of the medical necessity as stated in the text",
  "risk_factors": ["List of identified patient risk factors"],
  "medications": ["Current medications mentioned"],
  "allergies": ["Known allergies"],
  "lab_results": ["Key lab findings with values"],
  "vitals": "Key vital signs if mentioned"
}}

Do not include any Markdown formatting in your output, just the raw JSON string.

Medical Text:
{text}"""

        response = model.generate_content(prompt)
        
        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.startswith("```"):
            res_text = res_text[3:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]

        data = json.loads(res_text.strip())
        data["_extraction_method"] = "gemini_llm"
        data["_extraction_time_ms"] = int((time.time() - start_time) * 1000)
        return data

    except Exception as e:
        print(f"[ClinicalReader] LLM extraction failed: {e}, falling back to regex")
        return _regex_fallback(text, start_time)


def _regex_fallback(text: str, start_time: float) -> Dict[str, Any]:
    """Regex-based fallback extraction for when LLM is unavailable."""
    data = {
        "patient_name": _extract_pattern(text, r"(?:Patient|Name)[:\s]+([A-Z][a-z]+\s[A-Z][a-z]+)"),
        "patient_id": _extract_pattern(text, r"(?:MRN|ID|Patient ID)[:\s#]+(\w+[-]?\w+)"),
        "dob": _extract_pattern(text, r"(?:DOB|Date of Birth|Birth)[:\s]+(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})"),
        "gender": _extract_pattern(text, r"(?:Gender|Sex)[:\s]+(Male|Female|Other)", "Unknown"),
        "facility_name": _extract_pattern(text, r"(?:Hospital|Facility|Clinic|Center)[:\s]+([A-Z][\w\s]+(?:Hospital|Medical|Center|Clinic))"),
        "requesting_provider": _extract_pattern(text, r"(?:Dr\.|Doctor|Physician|Provider)[:\s]*([A-Z][\w\s,.]+(?:MD|DO|NP|PA)?)"),
        "diagnosis": _extract_pattern(text, r"(?:Diagnosis|Dx|Assessment)[:\s]+(.+?)(?:\n|$)"),
        "treatment": _extract_pattern(text, r"(?:Treatment|Procedure|Plan|Recommendation)[:\s]+(.+?)(?:\n|$)"),
        "icd_codes": re.findall(r'[A-Z]\d{2}(?:\.\d{1,4})?', text),
        "cpt_codes": re.findall(r'\b\d{5}\b', text),
        "dates": re.findall(r'\d{4}-\d{2}-\d{2}', text),
        "doctor_notes": text[:300] + "..." if len(text) > 300 else text,
        "clinical_rationale": "Extracted via regex fallback — LLM was unavailable.",
        "risk_factors": [],
        "medications": [],
        "allergies": [],
        "lab_results": [],
        "vitals": "",
        "_extraction_method": "regex_fallback",
        "_extraction_time_ms": int((time.time() - start_time) * 1000),
    }
    return data


def _extract_pattern(text: str, pattern: str, default: str = "Unknown") -> str:
    """Extract first match of a regex pattern from text."""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default


def validate_clinical_completeness(clinical_data: Dict[str, Any]) -> Dict[str, Any]:
    """Check if extracted clinical data has all required fields."""
    required = ["patient_name", "diagnosis", "treatment", "icd_codes", "cpt_codes"]
    missing = []
    for field in required:
        value = clinical_data.get(field)
        if not value or value == "Unknown" or value == "N/A" or (isinstance(value, list) and len(value) == 0):
            missing.append(field)

    return {
        "complete": len(missing) == 0,
        "missing_fields": missing,
        "completeness_score": round((len(required) - len(missing)) / len(required) * 100, 1),
    }
>>>>>>> dashboard
