"""
SureCare AI — Database Module
SQLite database with SQLAlchemy ORM. Tables: users, authorizations, audit_logs.
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


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="doctor")  # doctor | insurance | admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Authorization(Base):
    __tablename__ = "authorizations"
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String, unique=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String)
    patient_name = Column(String)
    status = Column(String, default="PENDING")  # PENDING | APPROVED | DENIED | INCOMPLETE | APPEALED
    approval_probability = Column(Float, default=0.0)
    confidence_score = Column(Integer, default=0)
    result_data = Column(Text)  # JSON blob
    pipeline_state = Column(Text)  # JSON: agent statuses
    appeal_data = Column(Text)  # JSON blob
    fhir_bundle = Column(Text)  # JSON blob
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String, index=True)
    agent_name = Column(String)
    action = Column(String)
    status = Column(String)  # started | completed | failed
    input_hash = Column(String)
    output_summary = Column(Text)
    details = Column(Text)  # JSON
    user_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    duration_ms = Column(Integer, default=0)


class LearningRecord(Base):
    """Stores past decisions for learning loop metrics."""
    __tablename__ = "learning_records"
    id = Column(Integer, primary_key=True, index=True)
    authorization_id = Column(String, index=True)
    predicted_status = Column(String)
    actual_status = Column(String)
    approval_probability = Column(Float)
    features = Column(Text)  # JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


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
