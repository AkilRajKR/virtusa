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
        }
