"""
SureCare AI — Pydantic Models
Request/Response schemas for all API endpoints.
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


# ── Auth ────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str = "doctor"

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]


# ── Upload ──────────────────────────────────────────────────
class UploadResponse(BaseModel):
    document_id: int
    auth_id: str
    filename: str
    page_count: int
    character_count: int
    text_preview: str


# ── Document Verification ────────────────────────────────────
class VerifyDocumentRequest(BaseModel):
    document_id: int
    action: str            # "VERIFIED" or "REJECTED"
    rejection_reason: Optional[str] = None

class DocumentInfo(BaseModel):
    id: int
    auth_id: str
    filename: str
    file_path: str
    uploaded_by: int
    uploader_role: str
    verified_status: str   # PENDING | VERIFIED | REJECTED
    verified_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: str


# ── Patient Upload ────────────────────────────────────────────
class PatientUploadRequest(BaseModel):
    auth_id: str           # which case to attach docs to


# ── Reprocess ────────────────────────────────────────────────
class ReprocessRequest(BaseModel):
    auth_id: str

class InsuranceRemarksRequest(BaseModel):
    auth_id: str
    remarks: str


# ── Case List Item ────────────────────────────────────────────
class CaseListItem(BaseModel):
    authorization_id: str
    patient_name: str
    status: str
    workflow_stage: str
    confidence_score: int
    approval_probability: float
    created_at: str
    document_count: int = 0
    pending_docs: int = 0
    filename: str = ""


# ── Analysis ────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    document_id: Optional[str] = None

class PipelineState(BaseModel):
    clinical_reader: str = "pending"
    evidence_builder: str = "pending"
    policy_intelligence: str = "pending"
    risk_prediction: str = "pending"
    submission: str = "pending"
    appeal: str = "pending"

class AnalysisResult(BaseModel):
    authorization_id: str
    status: str = "PENDING"
    approval_probability: float = 0.0
    confidence_score: int = 0
    explanation: str = ""
    missing_fields: List[str] = []
    timestamp: str = ""
    pipeline_summary: str = ""
    pipeline_state: PipelineState = PipelineState()
    details: Dict[str, Any] = {}
    audit_trail: List[Dict[str, Any]] = []


# ── Predict ─────────────────────────────────────────────────
class PredictRequest(BaseModel):
    authorization_id: str


# ── Submit ──────────────────────────────────────────────────
class SubmitRequest(BaseModel):
    authorization_id: str


# ── Appeal ──────────────────────────────────────────────────
class AppealRequest(BaseModel):
    authorization_id: str
    denial_reasons: List[str] = []

class InitiateAppealRequest(BaseModel):
    authorization_id: str


# ── Insurance ───────────────────────────────────────────────
class InsuranceDecisionRequest(BaseModel):
    authorization_id: str
    decision: str          # APPROVED | DENIED
    reason: str = ""


# ── Dashboard / Learning ────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_authorizations: int = 0
    approved: int = 0
    denied: int = 0
    incomplete: int = 0
    appealed: int = 0
    approval_rate: float = 0.0
    avg_confidence: float = 0.0
    recent_activity: List[Dict[str, Any]] = []
    trend_data: List[Dict[str, Any]] = []


# ── Notifications ───────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: int
    auth_id: str
    type: str
    subject: str
    message: str
    sent_at: str
    recipient_email: str
