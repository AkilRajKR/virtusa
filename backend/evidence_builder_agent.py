<<<<<<< HEAD
import google.generativeai as genai
import json
from typing import Dict, Any

def validate_evidence(clinical_data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    """
    Validate if medical evidence exists in the document to support the clinical data.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert medical evidence validator.
    Check if the specific clinical data extracted is actually supported by explicit evidence in the raw medical text.
    
    Look for:
    - Proof of diagnosis (e.g., lab results, imaging, explicit doctor statement)
    - Evidence supporting the treatment plan
    - Mention of prescriptions or explicit medical orders
    
    Clinical Data:
    {json.dumps(clinical_data, indent=2)}
    
    Raw text:
    {raw_text}
    
    Output JSON format MUST be exactly:
    {{
     "diagnosis_supported": true or false,
     "treatment_supported": true or false,
     "evidence_score": 0 to 100,
     "missing_documents": ["list of what is missing if unsupported, otherwise empty"],
     "citations": ["List of specific quotes from the medical text that prove the claims"]
    }}
    
    Do not include any Markdown formatting (like `json) in your output.
    """
    
    response = model.generate_content(prompt)
    
    try:
        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]
            
        data = json.loads(res_text.strip())
        return data
    except Exception as e:
        print(f"JSON Parsing Error in Evidence Builder Agent: {e}")
        return {
            "diagnosis_supported": False,
            "treatment_supported": False,
            "missing_documents": ["Error parsing evidence"]
=======
"""
SureCare AI — Evidence Builder Agent
Validates clinical claims against documentary evidence in the raw text.
"""
import google.generativeai as genai
import json
import time
from typing import Dict, Any

from config import GEMINI_MODEL


def validate_evidence(clinical_data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    """
    Validate if medical evidence in the document supports the extracted clinical data.
    """
    start_time = time.time()

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are an expert medical evidence validator for a prior authorization system.
Check if the specific clinical data extracted is actually supported by explicit evidence in the raw medical text.

Evaluate:
- Is there proof of the diagnosis (lab results, imaging, explicit doctor statement)?
- Is there evidence supporting the treatment plan?
- Are there prescriptions, medical orders, or referral letters?
- What documentation is missing that would strengthen the case?

Clinical Data:
{json.dumps(clinical_data, indent=2)}

Raw Medical Text:
{raw_text[:4000]}

Output JSON format MUST be exactly:
{{
  "diagnosis_supported": true or false,
  "treatment_supported": true or false,
  "evidence_score": 0 to 100,
  "missing_documents": ["list of what documentation is missing"],
  "citations": ["specific quotes from the medical text that prove the claims"],
  "evidence_gaps": ["list of evidence weaknesses"],
  "documentation_quality": "High/Medium/Low",
  "recommendation": "Brief recommendation for strengthening the case"
}}

Do not include any Markdown formatting in your output, just the raw JSON string."""

        response = model.generate_content(prompt)

        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.startswith("```"):
            res_text = res_text[3:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]

        data = json.loads(res_text.strip())
        data["_validation_time_ms"] = int((time.time() - start_time) * 1000)
        return data

    except Exception as e:
        print(f"[EvidenceBuilder] Error: {e}")
        return {
            "diagnosis_supported": False,
            "treatment_supported": False,
            "evidence_score": 0,
            "missing_documents": ["Error processing evidence validation"],
            "citations": [],
            "evidence_gaps": [str(e)],
            "documentation_quality": "Low",
            "recommendation": "Manual review required due to processing error.",
            "_validation_time_ms": int((time.time() - start_time) * 1000),
>>>>>>> dashboard
        }
