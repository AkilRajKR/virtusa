"""
SureCare AI — Configuration Module
Environment variables, paths, and application settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ────────────────────────────────────────────────
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
if GOOGLE_AI_API_KEY:
    import google.generativeai as genai
    genai.configure(api_key=GOOGLE_AI_API_KEY)

# ── JWT Settings ────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "surecare-ai-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# ── Database ────────────────────────────────────────────────
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "surecare.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# ── Uploads ─────────────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── FAISS ───────────────────────────────────────────────────
FAISS_INDEX_DIR = os.path.join(os.path.dirname(__file__), "faiss_index")
os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

# ── App Settings ────────────────────────────────────────────
APP_NAME = "SureCare AI"
APP_VERSION = "2.1.0"
CORS_ORIGINS = ["*"]
GEMINI_MODEL = "gemini-2.5-flash"

# ── Roles ───────────────────────────────────────────────────
ROLE_PATIENT   = "patient"
ROLE_DOCTOR    = "doctor"
ROLE_INSURANCE = "insurance"
ROLE_ADMIN     = "admin"
VALID_ROLES = [ROLE_PATIENT, ROLE_DOCTOR, ROLE_INSURANCE, ROLE_ADMIN]

# ── Document Verification States ────────────────────────────
DOC_PENDING  = "PENDING"
DOC_VERIFIED = "VERIFIED"
DOC_REJECTED = "REJECTED"

# ── Authorization Workflow Stages ────────────────────────────
STATUS_PROCESSING  = "PROCESSING"
STATUS_NEEDS_DOCTOR_INPUT = "NEEDS_DOCTOR_INPUT"
STATUS_INCOMPLETE  = "INCOMPLETE"
STATUS_APPROVED    = "APPROVED"
STATUS_DENIED      = "DENIED"
STATUS_FINAL_DENIED= "FINAL_DENIED"
STATUS_APPEALED    = "APPEALED"
STATUS_FINALIZED   = "FINALIZED"

# ── Notification Types ──────────────────────────────────────
NOTIFICATION_UPDATE = "UPDATE"
NOTIFICATION_DENIAL = "DENIAL"
