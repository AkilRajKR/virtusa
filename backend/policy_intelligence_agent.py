import google.generativeai as genai
import json
from typing import Dict, Any

def compare_against_policy(clinical_data: Dict[str, Any], evidence_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare extracted clinical data and evidence against insurance policy rules.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are a strict insurance policy intelligence agent.
    You evaluate a prior authorization request based on the clinical data and the evidence validated so far.
    
    Standard Policy Rules:
    - Treatment must logically match and be medically necessary for the diagnosis.
    - Diagnosis must be supported by evidence (diagnosis_supported must be true).
    - Treatment must be supported by evidence (treatment_supported must be true).
    - If there are missing documents required for the condition, the request is incomplete.
    
    Clinical Data:
    {json.dumps(clinical_data, indent=2)}
    
    Evidence Validation:
    {json.dumps(evidence_data, indent=2)}
    
    Based on these inputs, determine if standard policy covers this.
    
    Output JSON format MUST be exactly:
    {{
     "policy_match": true or false,
     "violations": ["list of policy rules violated, if any"],
     "coverage_status": "Covered" or "Not Covered"
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
        print(f"JSON Parsing Error in Policy Intelligence Agent: {e}")
        return {
            "policy_match": False,
            "violations": ["Error processing policy rules"],
            "coverage_status": "Not Covered"
        }
