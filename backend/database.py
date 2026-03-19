"""
SureCare AI — Database Module
Supabase PostgreSQL with SQLAlchemy ORM.
Tables: users, authorizations, documents, agent_logs, audit_logs, learning_records.
Supports hybrid data: structured columns + JSON text fields for semi-structured data.
"""
import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Boolean, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from config import DATABASE_URL

# ── Engine Setup ────────────────────────────────────────────
# Detect if using SQLite (fallback) or PostgreSQL (Supabase)
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ══════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════

class User(Base):
    """User profiles — supports patient, doctor, insurance, admin roles."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="doctor")  # patient | doctor | insurance | admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Authorization(Base):
    """Authorization requests with decision tracking and JSONB-style fields."""
    __tablename__ = "authorizations"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String(255))
    patient_name = Column(String(255))
    status = Column(String(50), default="PENDING")  # PENDING | APPROVED | DENIED | INCOMPLETE | PENDING_REVIEW | APPEALED
    approval_probability = Column(Float, default=0.0)
    confidence_score = Column(Integer, default=0)
    result_data = Column(Text)         # JSON blob — full pipeline output
    pipeline_state = Column(Text)      # JSON — agent statuses
    appeal_data = Column(Text)         # JSON blob — appeal output
    fhir_bundle = Column(Text)         # JSON blob — FHIR bundle
    missing_fields = Column(Text)      # JSON array — missing data fields
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Document(Base):
    """Uploaded documents — supports PDF, images, DOCX with OCR text and structured data."""
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String(50), index=True, nullable=True)      # Links to authorization (nullable for standalone uploads)
    uploaded_by = Column(Integer, nullable=False)                  # User ID of uploader
    uploader_role = Column(String(50), default="doctor")           # patient | doctor
    original_filename = Column(String(255))
    file_url = Column(Text)                                        # Supabase Storage URL or local path
    file_type = Column(String(20))                                 # pdf | png | jpg | jpeg | docx
    file_size_bytes = Column(BigInteger, default=0)
    ocr_text = Column(Text)                                        # Raw OCR/extracted text
    structured_data = Column(Text)                                 # JSON — AI-structured output from OCR
    verified = Column(Boolean, default=False)                      # Doctor/admin verification flag
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AgentLog(Base):
    """Per-agent execution logs with JSON output."""
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String(50), index=True)
    agent_name = Column(String(100))
    output = Column(Text)              # JSON — agent output
    status = Column(String(50))        # started | completed | failed
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    """System-wide audit trail."""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String(50), index=True)
    agent_name = Column(String(100))
    action = Column(String(255))
    status = Column(String(50))        # started | completed | failed
    input_hash = Column(String(64))
    output_summary = Column(Text)
    details = Column(Text)             # JSON
    user_id = Column(Integer)
    endpoint = Column(String(255))     # API endpoint for audit
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    duration_ms = Column(Integer, default=0)


class LearningRecord(Base):
    """Stores past decisions for learning loop metrics."""
    __tablename__ = "learning_records"
    id = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String(50), index=True)
    predicted_status = Column(String(50))
    actual_status = Column(String(50))
    approval_probability = Column(Float)
    features = Column(Text)            # JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ══════════════════════════════════════════════════════════════
# DATABASE INIT
# ══════════════════════════════════════════════════════════════

def init_db():
    """Create all tables and seed default users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default users if not exist
        defaults = [
            {"email": "admin@surecare.ai", "name": "System Admin", "password": "admin123", "role": "admin"},
            {"email": "doctor@surecare.ai", "name": "Dr. Sarah Chen", "password": "demo123", "role": "doctor"},
            {"email": "insurance@surecare.ai", "name": "BlueCross Reviewer", "password": "demo123", "role": "insurance"},
            {"email": "patient@surecare.ai", "name": "John Doe", "password": "demo123", "role": "patient"},
        ]
        for u in defaults:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    name=u["name"],
                    hashed_password=pwd_context.hash(u["password"]),
                    role=u["role"],
                )
                db.add(user)
        db.commit()
    finally:
        db.close()


def get_db():
    """FastAPI dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
