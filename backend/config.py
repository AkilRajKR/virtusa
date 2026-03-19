"""
SureCare AI — Configuration Module
Environment variables, paths, and application settings.
Supports Supabase PostgreSQL + Storage for hybrid data architecture.
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

# ── Database (Supabase PostgreSQL) ──────────────────────────
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./surecare.db")

# ── Supabase ────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET = "medical-documents"

# ── Uploads (local fallback) ───────────────────────────────
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
ROLE_PATIENT = "patient"
ROLE_DOCTOR = "doctor"
ROLE_INSURANCE = "insurance"
ROLE_ADMIN = "admin"
VALID_ROLES = [ROLE_PATIENT, ROLE_DOCTOR, ROLE_INSURANCE, ROLE_ADMIN]

# ── Allowed File Types ──────────────────────────────────────
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx"}
MAX_FILE_SIZE_MB = 20
