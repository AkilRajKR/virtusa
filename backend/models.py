"""
SureCare AI — Pydantic Models
Request/Response schemas for all API endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


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
    document_id: str
    filename: str
    text_preview: str
    page_count: int
    character_count: int

# ── Analysis ────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    document_id: Optional[str] = None

class ClinicalData(BaseModel):
    patient_name: str = "Unknown"
    patient_id: str = "N/A"
    dob: str = "Unknown"
    gender: str = "Unknown"
    facility_name: str = "Unknown"
    requesting_provider: str = "Unknown"
    diagnosis: str = ""
    treatment: str = ""
    icd_codes: List[str] = []
    cpt_codes: List[str] = []
    dates: List[str] = []
    doctor_notes: str = ""
    clinical_rationale: str = ""
    risk_factors: List[str] = []

class EvidenceData(BaseModel):
    diagnosis_supported: bool = False
    treatment_supported: bool = False
    evidence_score: int = 0
    missing_documents: List[str] = []
    citations: List[str] = []

class PolicyData(BaseModel):
    policy_match: bool = False
    violations: List[str] = []
    coverage_status: str = "Not Covered"
    priority_level: str = "Low"
    medical_necessity_rationale: str = ""

class RiskPrediction(BaseModel):
    approval_probability: float = 0.0
    confidence_interval: List[float] = [0.0, 0.0]
    feature_importance: Dict[str, float] = {}
    risk_category: str = "Unknown"
    model_version: str = "1.0"

class SubmissionData(BaseModel):
    fhir_bundle_type: str = "Prior Authorization Request"
    fhir_bundle: Dict[str, Any] = {}
    resource_count: int = 0
    status: str = "Generated"

class AppealData(BaseModel):
    appeal_letter: str = ""
    counter_arguments: List[str] = []
    supporting_references: List[str] = []
    recommended_actions: List[str] = []

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

class PredictResponse(BaseModel):
    authorization_id: str
    approval_probability: float
    confidence_interval: List[float]
    feature_importance: Dict[str, float]
    risk_category: str
    explanation: str

# ── Submit ──────────────────────────────────────────────────
class SubmitRequest(BaseModel):
    authorization_id: str

class SubmitResponse(BaseModel):
    authorization_id: str
    fhir_bundle: Dict[str, Any]
    submission_status: str
    payer_response: Optional[Dict[str, Any]] = None

# ── Appeal ──────────────────────────────────────────────────
class AppealRequest(BaseModel):
    authorization_id: str
    denial_reasons: List[str] = []

class AppealResponse(BaseModel):
    authorization_id: str
    appeal_letter: str
    counter_arguments: List[str]
    supporting_references: List[str]
    recommended_actions: List[str]
    new_status: str

# ── History / Audit ─────────────────────────────────────────
class HistoryItem(BaseModel):
    authorization_id: str
    filename: str
    patient_name: str
    status: str
    confidence_score: int
    approval_probability: float
    created_at: str

class AuditEntry(BaseModel):
    id: int
    authorization_id: str
    agent_name: str
    action: str
    status: str
    timestamp: str
    duration_ms: int
    output_summary: str = ""

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

class InsuranceDecisionRequest(BaseModel):
    authorization_id: str
    decision: str  # APPROVED | DENIED
    reason: str = ""
