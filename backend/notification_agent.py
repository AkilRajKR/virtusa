"""
SureCare AI — Notification Agent
Generates automated, professional denial explanations and notification emails.
"""
import logging
from typing import Dict, Any

from config import GOOGLE_AI_API_KEY, GEMINI_MODEL

logger = logging.getLogger("surecare.notification_agent")

if GOOGLE_AI_API_KEY:
    import google.generativeai as genai
    model = genai.GenerativeModel(GEMINI_MODEL)
else:
    model = None


def _fallback_generation(case_data: Dict[str, Any], notification_type: str) -> Dict[str, str]:
    if notification_type == "DENIAL":
        return {
            "subject": "Prior Authorization Update - Service Denied",
            "body": f"Dear Patient/Provider,\n\nThe prior authorization request for {case_data.get('patient_name', 'the patient')} has been denied. The submitted documents lacked sufficient clinical evidence to support medical necessity.\n\nPlease refer to your portal for appeal options."
        }
    else:
        return {
            "subject": "Prior Authorization Update - Additional Information Required",
            "body": f"Dear Patient/Provider,\n\nThe prior authorization request is incomplete. We require the following missing information to proceed:\n{', '.join(case_data.get('missing_fields', []))}\n\nPlease upload the requested documents via the portal."
        }


def generate_notification(case_data: Dict[str, Any], notification_type: str) -> Dict[str, str]:
    """
    Generates a professional email notification.
    Type can be 'DENIAL', 'INCOMPLETE', 'NEEDS_DOCTOR_INPUT'.
    """
    if not model:
        logger.warning("Notification Agent: GEMINI KEY MISSING. Using fallback.")
        return _fallback_generation(case_data, notification_type)

    logger.info(f"Notification Agent: Generating {notification_type} notice via Gemini...")

    system_prompt = f"""
    You are an automated administrative assistant for SureCare AI, a prior authorization system.
    Generate a professional email notification to the user (Patient or Doctor).
    
    Notification Type: {notification_type}
    
    Case Data:
    - Patient Name: {case_data.get('patient_name', 'Unknown')}
    - Missing Fields: {', '.join(case_data.get('missing_fields', []))}
    
    Instructions:
    1. If DENIAL: Explain clearly that the prior authorization is denied due to lack of medical necessity or completely unidentifiable data, and mention the appeal process.
    2. If INCOMPLETE: Explain that clinical data is missing (list the missing fields) and ask the patient to upload them.
    3. If NEEDS_DOCTOR_INPUT: Explain that the patient identity is missing or mismatched, and ask the provider to review and correct the authorization file.
    
    Return ONLY a raw JSON strictly formatted as:
    {{
      "subject": "[Clear Email Subject]",
      "body": "[Professional email body, multiline string]"
    }}
    Wait, inside the JSON, escape newlines in the body. Do not use Markdown formatting for the JSON output.
    """

    try:
        response = model.generate_content(system_prompt)
        raw_text = response.text.strip()
        
        # Clean off any markdown if prepended
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        import json
        result = json.loads(raw_text)
        return {
            "subject": result.get("subject", "Prior Authorization Update"),
            "body": result.get("body", "Please check the portal for updates on your authorization.")
        }
    except Exception as e:
        logger.error(f"Notification Agent Error: {e}")
        return _fallback_generation(case_data, notification_type)
