"""
SureCare AI — Database Module
SQLite + SQLAlchemy ORM.
Tables: users, authorizations, documents, audit_logs, learning_records
"""
import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ══════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role          = Column(String, nullable=False, default="doctor")  # patient|doctor|insurance|admin
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
    is_active     = Column(Boolean, default=True)


class Authorization(Base):
    __tablename__ = "authorizations"
    id                  = Column(Integer, primary_key=True, index=True)
    auth_id             = Column(String, unique=True, index=True)
    # Ownership
    created_by          = Column(Integer, nullable=False)          # user_id who created (doctor)
    patient_id          = Column(Integer, nullable=True)           # linked patient user_id
    assigned_doctor_id  = Column(Integer, nullable=True)           # doctor responsible
    # Legacy column kept for backward compat
    user_id             = Column(Integer, nullable=True)
    # Case info
    filename            = Column(String)
    patient_name        = Column(String)
    workflow_stage      = Column(String, default="UPLOAD")         # UPLOAD|ANALYSIS|INCOMPLETE|VERIFICATION|REPROCESS|FINALIZED
    status              = Column(String, default="PROCESSING")     # PROCESSING|INCOMPLETE|APPROVED|DENIED|APPEALED|FINALIZED
    approval_probability = Column(Float, default=0.0)
    confidence_score    = Column(Integer, default=0)
    # JSON blobs
    result_data         = Column(Text)
    pipeline_state      = Column(Text)
    appeal_data         = Column(Text)
    fhir_bundle         = Column(Text)
    missing_fields      = Column(Text)                             # JSON list
    insurance_remarks   = Column(Text)                             # Optional remarks by insurance
    appeal_count     = Column(Integer, default=0)                  # Number of appeals tried
    parent_case_id   = Column(String, index=True, nullable=True)   # Original case
    version          = Column(Integer, default=1)                  # Case version iteration
    created_at       = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Document(Base):
    """
    Tracks individual documents attached to an authorization.
    verified_status: PENDING → VERIFIED | REJECTED
    """
    __tablename__ = "documents"
    id              = Column(Integer, primary_key=True, index=True)
    auth_id         = Column(String, index=True, nullable=False)
    filename        = Column(String, nullable=False)
    file_path       = Column(String)                               # disk path
    file_size       = Column(Integer, default=0)
    file_hash       = Column(String, index=True, nullable=True)    # For duplicate detection
    version         = Column(Integer, default=1)                   # Version control
    uploaded_by     = Column(Integer, nullable=False)              # user_id
    uploader_role   = Column(String, nullable=False)               # doctor|patient
    verified_status = Column(String, default="PENDING")            # PENDING|VERIFIED|REJECTED
    verified_by     = Column(Integer, nullable=True)               # doctor user_id who verified
    rejection_reason = Column(Text, nullable=True)
    # Extracted text (from pypdf)
    extracted_text  = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id               = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String, index=True)
    agent_name       = Column(String)
    action           = Column(String)
    status           = Column(String)   # started | completed | failed
    input_hash       = Column(String)
    output_summary   = Column(Text)
    details          = Column(Text)     # JSON
    user_id          = Column(Integer)
    timestamp        = Column(DateTime, default=datetime.datetime.utcnow)
    duration_ms      = Column(Integer, default=0)


class LearningRecord(Base):
    """Stores past decisions for learning loop metrics."""
    __tablename__ = "learning_records"
    id               = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String, index=True)
    predicted_status = Column(String)
    actual_status    = Column(String)
    approval_probability = Column(Float)
    features         = Column(Text)     # JSON
    created_at       = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    """Tracks automated system emails and workflow alerts."""
    __tablename__ = "notifications"
    id               = Column(Integer, primary_key=True, index=True)
    auth_id          = Column(String, index=True, nullable=False)
    user_id          = Column(Integer, nullable=True)           # Recipient user_id (patient or doctor)
    recipient_email  = Column(String, nullable=False)           # Actual email sent to
    type             = Column(String, nullable=False)           # DENIAL|UPDATE
    subject          = Column(String, nullable=False)
    message          = Column(Text, nullable=False)
    sent_at          = Column(DateTime, default=datetime.datetime.utcnow)


# ══════════════════════════════════════════════════════════════
# INIT & SEED
# ══════════════════════════════════════════════════════════════

def init_db():
    """Create all tables and seed default users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        defaults = [
            {"email": "admin@surecare.ai",     "name": "System Admin",      "password": "admin123", "role": "admin"},
            {"email": "doctor@surecare.ai",    "name": "Dr. Sarah Chen",    "password": "demo123",  "role": "doctor"},
            {"email": "doctor2@surecare.ai",   "name": "Dr. James Wilson",  "password": "demo123",  "role": "doctor"},
            {"email": "patient@surecare.ai",   "name": "John Patient",      "password": "demo123",  "role": "patient"},
            {"email": "insurance@surecare.ai", "name": "BlueCross Reviewer","password": "demo123",  "role": "insurance"},
        ]
        for u in defaults:
            if not db.query(User).filter(User.email == u["email"]).first():
                db.add(User(
                    email=u["email"],
                    name=u["name"],
                    hashed_password=pwd_context.hash(u["password"]),
                    role=u["role"],
                ))
        db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
