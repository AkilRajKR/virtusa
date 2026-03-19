"""
SureCare AI — OCR Service
Extracts text from uploaded documents (PDF, images, DOCX).
Structures raw OCR text into JSON using Google Gemini LLM.
"""
import io
import json
import logging
from typing import Optional

logger = logging.getLogger("surecare.ocr")


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return ""


def extract_text_from_image(content: bytes) -> str:
    """Extract text from an image using Tesseract OCR via pytesseract."""
    try:
        from PIL import Image
        import pytesseract

        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image, lang="eng")
        return text.strip()
    except ImportError:
        logger.warning("pytesseract not installed — image OCR unavailable")
        return "[OCR unavailable: pytesseract not installed]"
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return f"[OCR error: {str(e)}]"


def extract_text_from_docx(content: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document as DocxDocument

        doc = DocxDocument(io.BytesIO(content))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs).strip()
    except ImportError:
        logger.warning("python-docx not installed — DOCX extraction unavailable")
        return "[DOCX extraction unavailable: python-docx not installed]"
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        return f"[DOCX error: {str(e)}]"


def extract_text(content: bytes, file_type: str) -> str:
    """
    Route to the correct extraction method based on file type.
    Supported: pdf, png, jpg, jpeg, docx
    """
    file_type = file_type.lower().strip(".")

    if file_type == "pdf":
        return extract_text_from_pdf(content)
    elif file_type in ("png", "jpg", "jpeg", "tiff", "bmp"):
        return extract_text_from_image(content)
    elif file_type == "docx":
        return extract_text_from_docx(content)
    else:
        logger.warning(f"Unsupported file type for OCR: {file_type}")
        return f"[Unsupported file type: {file_type}]"


def structure_ocr_output(raw_text: str) -> dict:
    """
    Use Google Gemini to convert raw OCR text into structured clinical JSON.
    Returns a dict with patient_name, diagnosis, treatment, ICD/CPT codes, etc.
    Falls back to a basic structure if Gemini is unavailable.
    """
    if not raw_text or len(raw_text.strip()) < 20:
        return {"error": "Insufficient text for structuring", "raw_length": len(raw_text)}

    try:
        from config import GOOGLE_AI_API_KEY, GEMINI_MODEL

        if not GOOGLE_AI_API_KEY:
            logger.warning("Gemini API key not set — using basic structuring")
            return _basic_structure(raw_text)

        import google.generativeai as genai
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are a medical data extraction specialist. Analyze the following OCR-extracted text from a clinical document and extract structured information.

Return ONLY a valid JSON object (no markdown formatting) with these fields:
{{
    "patient_name": "string or Unknown",
    "patient_id": "string or N/A",
    "dob": "string or Unknown",
    "gender": "string or Unknown",
    "facility_name": "string or Unknown",
    "requesting_provider": "string or Unknown",
    "diagnosis": "primary diagnosis string",
    "treatment": "requested treatment string",
    "icd_codes": ["list of ICD-10 codes found"],
    "cpt_codes": ["list of CPT codes found"],
    "dates": ["list of relevant dates found"],
    "doctor_notes": "summary of clinical notes",
    "clinical_rationale": "medical necessity reasoning if found",
    "risk_factors": ["list of risk factors"],
    "medications": ["list of current medications"],
    "lab_results": ["list of lab results with values"],
    "insurance_info": "insurance details if found"
}}

OCR Text:
---
{raw_text[:8000]}
---

Return ONLY the JSON object, no explanation."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean markdown code fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[-1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        structured = json.loads(response_text)
        structured["_source"] = "gemini"
        structured["_raw_text_length"] = len(raw_text)
        return structured

    except json.JSONDecodeError as e:
        logger.error(f"Gemini returned invalid JSON: {e}")
        return _basic_structure(raw_text)
    except Exception as e:
        logger.error(f"Gemini structuring failed: {e}")
        return _basic_structure(raw_text)


def _basic_structure(raw_text: str) -> dict:
    """Fallback: basic keyword-based text extraction."""
    import re

    # Try to find common patterns
    icd_codes = re.findall(r'\b[A-Z]\d{2}\.?\d{0,4}\b', raw_text)
    cpt_codes = re.findall(r'\b\d{5}\b', raw_text)
    dates = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', raw_text)

    return {
        "patient_name": "Unknown",
        "patient_id": "N/A",
        "dob": "Unknown",
        "gender": "Unknown",
        "facility_name": "Unknown",
        "requesting_provider": "Unknown",
        "diagnosis": "",
        "treatment": "",
        "icd_codes": icd_codes[:10],
        "cpt_codes": cpt_codes[:10],
        "dates": dates[:10],
        "doctor_notes": raw_text[:500] if raw_text else "",
        "clinical_rationale": "",
        "risk_factors": [],
        "medications": [],
        "lab_results": [],
        "insurance_info": "",
        "_source": "basic_extraction",
        "_raw_text_length": len(raw_text),
    }
