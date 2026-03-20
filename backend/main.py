"""
SureCare AI — Main Application & REST API Routes
FastAPI orchestrator: JWT auth, 4-role RBAC, full pipeline execution,
document verification lifecycle, and automatic reprocess trigger.

AI pipeline logic is NOT modified — only new endpoints added.
"""
import os
import io
import json
import uuid
import time
import logging
import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pypdf import PdfReader

from config import (
    JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS, UPLOAD_DIR,
    APP_NAME, APP_VERSION, CORS_ORIGINS, VALID_ROLES,
    ROLE_PATIENT, ROLE_DOCTOR, ROLE_INSURANCE, ROLE_ADMIN,
    DOC_PENDING, DOC_VERIFIED, DOC_REJECTED,
    STATUS_PROCESSING, STATUS_INCOMPLETE, STATUS_APPROVED, STATUS_DENIED,
    STATUS_APPEALED, STATUS_FINALIZED, STATUS_NEEDS_DOCTOR_INPUT,
    STATUS_FINAL_DENIED, NOTIFICATION_UPDATE, NOTIFICATION_DENIAL
)
from database import (
    init_db, get_db, SessionLocal, User, Authorization, Document,
    AuditLog, LearningRecord, Notification, pwd_context,
)
from models import (
    LoginRequest, RegisterRequest,
    AnalysisResult, PipelineState,
    PredictRequest, SubmitRequest,
    AppealRequest, InsuranceDecisionRequest,
    VerifyDocumentRequest, ReprocessRequest,
    InsuranceRemarksRequest, NotificationResponse,
    InitiateAppealRequest
)
from clinical_reader_agent import extract_clinical_data, validate_clinical_completeness
from evidence_builder_agent import validate_evidence
from policy_intelligence_agent import compare_against_policy
from risk_prediction_agent import predict_approval
from submission_agent import generate_fhir_bundle
from appeal_agent import generate_appeal
from notification_agent import generate_notification
from fhir_simulator import simulate_claim_response, simulate_coverage_eligibility
from audit_trail import log_agent_event, get_audit_logs, build_audit_trail_for_auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("surecare")

security = HTTPBearer(auto_error=False)


# ── Lifespan ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Initializing {APP_NAME} v{APP_VERSION}")
    init_db()
    logger.info("Database initialized")
    yield

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI-Driven Prior Authorization System — Role-Based Workflow Edition",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Legacy in-memory store for analyze endpoint backward compat
uploaded_documents: dict = {}


# ══════════════════════════════════════════════════════════════
# AUTH HELPERS
# ══════════════════════════════════════════════════════════════

def create_token(user_id: int, email: str, role: str, name: str) -> str:
    return jwt.encode({
        "sub": str(user_id), "email": email, "role": role, "name": name,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    return decode_token(credentials.credentials)


def require_role(*allowed_roles):
    async def _check(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required: {', '.join(allowed_roles)}. Your role: {user['role']}",
            )
        return user
    return _check


# ══════════════════════════════════════════════════════════════
# PIPELINE HELPER — reusable, called from analyze & reprocess
# ══════════════════════════════════════════════════════════════

def _run_pipeline(auth_id: str, text: str, filename: str, user_id: int, db) -> dict:
    """
    Executes the 5-agent pipeline and persists results.
    Returns the full result dict. Does NOT commit to db — caller does.
    """
    pipeline_state = {k: "pending" for k in
        ["clinical_reader", "evidence_builder", "policy_intelligence", "risk_prediction", "submission", "appeal"]}

    # ── Agent 1: Clinical Reader ───────────────────────────
    pipeline_state["clinical_reader"] = "running"
    log_agent_event(auth_id, "Clinical Reader", "extract_clinical_data", "started", user_id=user_id)
    t0 = time.time()
    clinical_data = extract_clinical_data(text)
    t1 = time.time()
    completeness = validate_clinical_completeness(clinical_data)
    pipeline_state["clinical_reader"] = "completed"
    log_agent_event(auth_id, "Clinical Reader", "extract_clinical_data", "completed",
                   output_summary=f"Patient: {clinical_data.get('patient_name','?')}, Dx: {clinical_data.get('diagnosis','?')}",
                   duration_ms=int((t1-t0)*1000), user_id=user_id)

    missing_fields = completeness.get("missing_fields", [])
    patient_name = clinical_data.get("patient_name", "")

    # ── Identity Resolution & Early Exit check ──────────────
    abort_pipeline = False
    status = STATUS_PROCESSING
    explanation = ""
    submission_data = None
    appeal_data_out = None
    approval_probability = 0.0
    confidence_score = 0
    risk_data = {}
    policy_data = {}
    evidence_data = {}
    
    # helper for creating notifications before bailing out
    def _create_notif(n_type, auth_id, pt_name, m_fields, email):
        case_data = {"patient_name": pt_name, "missing_fields": m_fields}
        n_content = generate_notification(case_data, n_type)
        db_notif = Notification(
            auth_id=auth_id, type=n_type, subject=n_content["subject"],
            message=n_content["body"], recipient_email=email
        )
        db.add(db_notif)
        db.commit()

    if not patient_name and len(missing_fields) >= 5:
        # 1. No usable data -> Auto Denial
        status = STATUS_DENIED
        explanation = "Authorization automatically denied. Document contains no identifiable clinical or patient data."
        abort_pipeline = True
        _create_notif(NOTIFICATION_DENIAL, auth_id, "Unknown", missing_fields, "doctor@surecare.ai")
        pipeline_state.update({k: "skipped" for k in ["evidence_builder", "policy_intelligence", "risk_prediction", "submission", "appeal"]})
        log_agent_event(auth_id, "Orchestrator", "identity_resolution", "completed", output_summary="AUTO DENIED: Missing all data", user_id=user_id)
        
    elif not patient_name or patient_name.lower() in ["unknown", "n/a", ""]:
        # 2. No patient info -> Return to doctor
        status = STATUS_NEEDS_DOCTOR_INPUT
        explanation = "Patient identity missing. Doctor input required."
        abort_pipeline = True
        _create_notif(NOTIFICATION_UPDATE, auth_id, "Unknown", missing_fields, "doctor@surecare.ai")
        pipeline_state.update({k: "skipped" for k in ["evidence_builder", "policy_intelligence", "risk_prediction", "submission", "appeal"]})
        log_agent_event(auth_id, "Orchestrator", "identity_resolution", "completed", output_summary="NEEDS_DOCTOR_INPUT: Identity missing", user_id=user_id)
        
    elif completeness.get("completeness_score", 0) < 40 or len(missing_fields) >= 3:
        # 3. Clinical Data missing -> Incomplete for patient
        status = STATUS_INCOMPLETE
        explanation = f"Insufficient clinical data. Missing: {', '.join(missing_fields)}."
        abort_pipeline = True
        _create_notif(NOTIFICATION_UPDATE, auth_id, patient_name, missing_fields, "patient@surecare.ai")
        pipeline_state.update({k: "skipped" for k in ["evidence_builder", "policy_intelligence", "risk_prediction", "submission", "appeal"]})
        log_agent_event(auth_id, "Orchestrator", "identity_resolution", "completed", output_summary=f"INCOMPLETE: {len(missing_fields)} missing fields", user_id=user_id)

    if not abort_pipeline:
        # ── Agent 2: Evidence Builder ──────────────────────────
        pipeline_state["evidence_builder"] = "running"
        log_agent_event(auth_id, "Evidence Builder", "validate_evidence", "started", user_id=user_id)
        t0 = time.time()
        evidence_data = validate_evidence(clinical_data, text)
        t1 = time.time()
        pipeline_state["evidence_builder"] = "completed"
        log_agent_event(auth_id, "Evidence Builder", "validate_evidence", "completed",
                       output_summary=f"Score: {evidence_data.get('evidence_score',0)}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        # ── Agent 3: Policy Intelligence ───────────────────────
        pipeline_state["policy_intelligence"] = "running"
        log_agent_event(auth_id, "Policy Intelligence", "compare_against_policy", "started", user_id=user_id)
        t0 = time.time()
        policy_data = compare_against_policy(clinical_data, evidence_data)
        t1 = time.time()
        pipeline_state["policy_intelligence"] = "completed"
        log_agent_event(auth_id, "Policy Intelligence", "compare_against_policy", "completed",
                       output_summary=f"Match: {policy_data.get('policy_match', False)}, Coverage: {policy_data.get('coverage_status','?')}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        # ── Agent 4: Risk Prediction ──────────────────────────
        pipeline_state["risk_prediction"] = "running"
        log_agent_event(auth_id, "Risk Prediction", "predict_approval", "started", user_id=user_id)
        t0 = time.time()
        risk_data = predict_approval(clinical_data, evidence_data, policy_data)
        t1 = time.time()
        pipeline_state["risk_prediction"] = "completed"
        log_agent_event(auth_id, "Risk Prediction", "predict_approval", "completed",
                       output_summary=f"Probability: {risk_data.get('approval_probability',0):.2%}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        approval_probability = risk_data.get("approval_probability", 0)
        confidence_score = int(approval_probability * 100)

        # ── Decision Routing ──────────────────────────────────
        if completeness.get("completeness_score", 0) < 40 or len(missing_fields) >= 3:
            status = STATUS_INCOMPLETE
            explanation = f"Insufficient clinical data. Missing: {', '.join(missing_fields)}."
            pipeline_state["submission"] = "skipped"
            pipeline_state["appeal"] = "skipped"
            log_agent_event(auth_id, "Orchestrator", "decision_routing", "completed",
                           output_summary=f"INCOMPLETE — {len(missing_fields)} missing fields", user_id=user_id)
        elif approval_probability >= 0.60 and policy_data.get("policy_match", False):
            status = STATUS_APPROVED
            explanation = risk_data.get("explanation", "Authorization approved.")
            pipeline_state["submission"] = "running"
            log_agent_event(auth_id, "Submission Agent", "generate_fhir_bundle", "started", user_id=user_id)
            t0 = time.time()
            submission_data = generate_fhir_bundle(clinical_data, evidence_data, policy_data, risk_data, auth_id)
            t1 = time.time()
            pipeline_state["submission"] = "completed"
            pipeline_state["appeal"] = "not_needed"
            log_agent_event(auth_id, "Submission Agent", "generate_fhir_bundle", "completed",
                           output_summary=f"Bundle: {submission_data.get('resource_count',0)} resources",
                           duration_ms=int((t1-t0)*1000), user_id=user_id)
        else:
            status = STATUS_DENIED
            explanation = risk_data.get("explanation", "Authorization denied.")
            pipeline_state["submission"] = "not_applicable"
            pipeline_state["appeal"] = "running"
            log_agent_event(auth_id, "Appeal Agent", "generate_appeal", "started", user_id=user_id)
            t0 = time.time()
            denial_reasons = policy_data.get("violations", []) + evidence_data.get("missing_documents", [])
            appeal_data_out = generate_appeal(clinical_data, evidence_data, policy_data, risk_data, denial_reasons, auth_id)
            t1 = time.time()
            pipeline_state["appeal"] = "completed"
            log_agent_event(auth_id, "Appeal Agent", "generate_appeal", "completed",
                           output_summary=f"Appeal strength: {appeal_data_out.get('appeal_strength','?')}",
                           duration_ms=int((t1-t0)*1000), user_id=user_id)

    audit_trail = build_audit_trail_for_auth(auth_id)
    result = {
        "authorization_id": auth_id,
        "status": status,
        "approval_probability": approval_probability,
        "confidence_score": confidence_score,
        "explanation": explanation,
        "missing_fields": missing_fields,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "pipeline_summary": f"Processed through {sum(1 for v in pipeline_state.values() if v=='completed')} agent nodes.",
        "pipeline_state": pipeline_state,
        "details": {
            "clinical_data": clinical_data,
            "evidence_data": evidence_data,
            "policy_data": policy_data,
            "risk_prediction": risk_data,
            "submission": submission_data,
            "appeal": appeal_data_out,
        },
        "audit_trail": audit_trail,
    }
    return result, status, approval_probability, confidence_score, missing_fields, pipeline_state, submission_data, appeal_data_out


def _check_and_auto_reprocess(auth_id: str, doctore_user_id: int, db):
    """
    Called after every document verification.
    If ALL documents for auth_id are VERIFIED → auto-run pipeline.
    """
    docs = db.query(Document).filter(Document.auth_id == auth_id).all()
    if not docs:
        return False
    all_verified = all(d.verified_status == DOC_VERIFIED for d in docs)
    if not all_verified:
        return False

    # Get combined text from all verified docs
    combined_text = ""
    for d in docs:
        if d.extracted_text:
            combined_text += d.extracted_text + "\n"

    if not combined_text.strip():
        return False

    auth = db.query(Authorization).filter(Authorization.auth_id == auth_id).first()
    if not auth:
        return False

    logger.info(f"AUTO-REPROCESS triggered for {auth_id} — all docs verified")
    log_agent_event(auth_id, "Orchestrator", "auto_reprocess_triggered", "started",
                   output_summary="All documents verified — auto-triggering pipeline", user_id=doctore_user_id)

    try:
        result, status, prob, conf, missing, pstate, sub, appl = _run_pipeline(
            auth_id, combined_text, auth.filename or "reprocessed", doctore_user_id, db
        )
        # Mark FINALIZED if approved, otherwise keep status
        final_status = STATUS_FINALIZED if status == STATUS_APPROVED else status
        auth.status = final_status
        auth.workflow_stage = "FINALIZED"
        auth.approval_probability = prob
        auth.confidence_score = conf
        auth.missing_fields = json.dumps(missing)
        auth.result_data = json.dumps(result, default=str)
        auth.pipeline_state = json.dumps(pstate)
        if sub:
            auth.fhir_bundle = json.dumps(sub, default=str)
        if appl:
            auth.appeal_data = json.dumps(appl, default=str)
        db.add(LearningRecord(
            authorization_id=auth_id,
            predicted_status=status,
            approval_probability=prob,
            features=json.dumps(result.get("details", {}).get("risk_prediction", {}).get("feature_values", {})),
        ))
        db.commit()
        logger.info(f"Auto-reprocess complete: {auth_id} → {final_status}")
        return True
    except Exception as e:
        logger.error(f"Auto-reprocess failed for {auth_id}: {e}", exc_info=True)
        return False


# ══════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not pwd_context.verify(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "token": create_token(user.id, user.email, user.role, user.name),
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        }
    finally:
        db.close()


@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if req.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == req.email).first():
            raise HTTPException(status_code=409, detail="Email already registered")
        user = User(email=req.email, name=req.name,
                    hashed_password=pwd_context.hash(req.password), role=req.role)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "token": create_token(user.id, user.email, user.role, user.name),
            "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# UPLOAD — Doctor creates case + uploads initial document
# ══════════════════════════════════════════════════════════════

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    auth_id: Optional[str] = Form(None),
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    """Doctor uploads initial PDF to create or attach to an authorization."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    try:
        pdf = PdfReader(io.BytesIO(content))
        text = "".join(
            (p.extract_text() or "") + "\n" for p in pdf.pages
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF contains no extractable text")

    user_id = int(user["sub"])

    # Generate auth_id if not provided
    if not auth_id:
        auth_id = f"AUTH-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"

    db = SessionLocal()
    try:
        # Create authorization record if doesn't exist
        auth_record = db.query(Authorization).filter(Authorization.auth_id == auth_id).first()
        if not auth_record:
            auth_record = Authorization(
                auth_id=auth_id,
                created_by=user_id,
                user_id=user_id,
                assigned_doctor_id=user_id,
                patient_id=patient_id,
                filename=file.filename,
                status="PROCESSING",
                workflow_stage="UPLOAD",
            )
            db.add(auth_record)
            db.flush()

        # Save file to disk
        doc_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, doc_filename)
        with open(filepath, "wb") as f:
            f.write(content)

        # Create Document record
        doc = Document(
            auth_id=auth_id,
            filename=file.filename,
            file_path=filepath,
            file_size=len(content),
            uploaded_by=user_id,
            uploader_role=ROLE_DOCTOR,
            verified_status=DOC_PENDING,
            extracted_text=text,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Also store in legacy memory store for /api/analyze
        uploaded_documents[f"DOC-{doc.id}"] = {
            "filename": file.filename, "text": text,
            "pages": len(pdf.pages), "path": filepath,
        }

        log_agent_event(auth_id, "System", "document_uploaded", "completed",
                       output_summary=f"Doctor uploaded: {file.filename}", user_id=user_id)

        return {
            "document_id": doc.id,
            "auth_id": auth_id,
            "filename": file.filename,
            "page_count": len(pdf.pages),
            "character_count": len(text),
            "text_preview": text[:300] + "..." if len(text) > 300 else text,
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PATIENT UPLOAD — Patient adds missing documents to their case
# ══════════════════════════════════════════════════════════════

@app.post("/api/patient/upload")
async def patient_upload(
    file: UploadFile = File(...),
    auth_id: str = Form(...),
    user=Depends(require_role(ROLE_PATIENT)),
):
    """Patient uploads a supplementary document for an INCOMPLETE case."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    patient_user_id = int(user["sub"])
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if auth.patient_id != patient_user_id:
            raise HTTPException(status_code=403, detail="You are not the patient on this case")
        if auth.status not in (STATUS_INCOMPLETE,):
            raise HTTPException(status_code=400,
                detail=f"Documents can only be uploaded when status is INCOMPLETE. Current: {auth.status}")

        content = await file.read()
        try:
            pdf = PdfReader(io.BytesIO(content))
            text = "".join((p.extract_text() or "") + "\n" for p in pdf.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

        doc_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, doc_filename)
        with open(filepath, "wb") as f:
            f.write(content)

        doc = Document(
            auth_id=auth_id,
            filename=file.filename,
            file_path=filepath,
            file_size=len(content),
            uploaded_by=patient_user_id,
            uploader_role=ROLE_PATIENT,
            verified_status=DOC_PENDING,
            extracted_text=text,
        )
        db.add(doc)

        # Update workflow stage
        auth.workflow_stage = "VERIFICATION"
        db.commit()
        db.refresh(doc)

        log_agent_event(auth_id, "System", "patient_document_uploaded", "completed",
                       output_summary=f"Patient uploaded: {file.filename}", user_id=patient_user_id)

        return {
            "document_id": doc.id,
            "auth_id": auth_id,
            "filename": file.filename,
            "verified_status": DOC_PENDING,
            "message": "Document uploaded — awaiting doctor verification",
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# ANALYZE — Full AI pipeline (Doctor)
# ══════════════════════════════════════════════════════════════

@app.post("/api/analyze")
async def analyze_document(
    file: UploadFile = File(None),
    document_id: str = Form(None),
    auth_id: str = Form(None),
    patient_id: Optional[int] = Form(None),
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    user_id = int(user["sub"])

    # Resolve text
    if document_id and document_id in uploaded_documents:
        doc_meta = uploaded_documents[document_id]
        text = doc_meta["text"]
        filename = doc_meta["filename"]
    elif file:
        content = await file.read()
        try:
            pdf = PdfReader(io.BytesIO(content))
            text = "".join((p.extract_text() or "") + "\n" for p in pdf.pages)
            filename = file.filename
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")
    else:
        raise HTTPException(status_code=400, detail="Provide document_id or upload a file")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the document")

    new_auth_id = auth_id or f"AUTH-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"

    db = SessionLocal()
    try:
        auth_record = Authorization(
            auth_id=new_auth_id,
            created_by=user_id,
            user_id=user_id,
            assigned_doctor_id=user_id,
            patient_id=patient_id,
            filename=filename,
            status="PROCESSING",
            workflow_stage="ANALYSIS",
        )
        db.add(auth_record)
        db.commit()

        result, status, prob, conf, missing, pstate, sub, appl = _run_pipeline(
            new_auth_id, text, filename, user_id, db
        )

        # Determine workflow stage
        wf_stage = "INCOMPLETE" if status == STATUS_INCOMPLETE else "ANALYSIS"
        auth_record.status = status
        auth_record.workflow_stage = wf_stage
        auth_record.patient_name = result["details"]["clinical_data"].get("patient_name", "Unknown")
        auth_record.approval_probability = prob
        auth_record.confidence_score = conf
        auth_record.missing_fields = json.dumps(missing)
        auth_record.result_data = json.dumps(result, default=str)
        auth_record.pipeline_state = json.dumps(pstate)
        if sub:
            auth_record.fhir_bundle = json.dumps(sub, default=str)
        if appl:
            auth_record.appeal_data = json.dumps(appl, default=str)
        db.add(LearningRecord(
            authorization_id=new_auth_id,
            predicted_status=status,
            approval_probability=prob,
            features=json.dumps(result["details"]["risk_prediction"].get("feature_values", {})),
        ))
        db.commit()

        logger.info(f"Pipeline: {new_auth_id} → {status} ({conf}%)")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# DOCTOR VERIFY — Set verified_status on a document
# ══════════════════════════════════════════════════════════════

@app.post("/api/doctor/verify")
async def verify_document(
    req: VerifyDocumentRequest,
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    """Doctor marks a document VERIFIED or REJECTED. If all docs VERIFIED → auto-reprocess."""
    if req.action not in (DOC_VERIFIED, DOC_REJECTED):
        raise HTTPException(status_code=400, detail="action must be VERIFIED or REJECTED")
    if req.action == DOC_REJECTED and not req.rejection_reason:
        raise HTTPException(status_code=400, detail="rejection_reason is required when rejecting")

    doctor_id = int(user["sub"])
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Check doctor is assigned to this case
        auth = db.query(Authorization).filter(Authorization.auth_id == doc.auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if user["role"] == ROLE_DOCTOR and auth.assigned_doctor_id != doctor_id:
            raise HTTPException(status_code=403, detail="You are not assigned to this case")

        doc.verified_status = req.action
        doc.verified_by = doctor_id
        doc.rejection_reason = req.rejection_reason if req.action == DOC_REJECTED else None
        db.commit()

        log_agent_event(doc.auth_id, "Doctor", f"document_{req.action.lower()}", "completed",
                       output_summary=f"Doc {doc.id} ({doc.filename}) → {req.action}", user_id=doctor_id)

        # Auto-trigger check
        triggered = False
        if req.action == DOC_VERIFIED:
            triggered = _check_and_auto_reprocess(doc.auth_id, doctor_id, db)

        return {
            "document_id": doc.id,
            "auth_id": doc.auth_id,
            "filename": doc.filename,
            "verified_status": req.action,
            "auto_reprocess_triggered": triggered,
            "message": "Auto-reprocess triggered — case finalized." if triggered else f"Document marked {req.action}",
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# MANUAL REPROCESS — Doctor manually triggers reprocess
# ══════════════════════════════════════════════════════════════

@app.post("/api/reprocess")
async def reprocess(
    req: ReprocessRequest,
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    """Manually trigger pipeline re-run. Blocked if any doc is PENDING or REJECTED."""
    doctor_id = int(user["sub"])
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if user["role"] == ROLE_DOCTOR and auth.assigned_doctor_id != doctor_id:
            raise HTTPException(status_code=403, detail="Not assigned to this case")

        docs = db.query(Document).filter(Document.auth_id == req.auth_id).all()
        unverified = [d for d in docs if d.verified_status != DOC_VERIFIED]
        if unverified:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reprocess: {len(unverified)} document(s) not yet VERIFIED."
            )

        combined_text = "\n".join(d.extracted_text or "" for d in docs).strip()
        if not combined_text:
            raise HTTPException(status_code=400, detail="No document text available for reprocessing")

        result, status, prob, conf, missing, pstate, sub, appl = _run_pipeline(
            req.auth_id, combined_text, auth.filename or "reprocessed", doctor_id, db
        )

        final_status = STATUS_FINALIZED if status == STATUS_APPROVED else status
        auth.status = final_status
        auth.workflow_stage = "FINALIZED"
        auth.approval_probability = prob
        auth.confidence_score = conf
        auth.missing_fields = json.dumps(missing)
        auth.result_data = json.dumps(result, default=str)
        auth.pipeline_state = json.dumps(pstate)
        if sub:
            auth.fhir_bundle = json.dumps(sub, default=str)
        if appl:
            auth.appeal_data = json.dumps(appl, default=str)
        db.add(LearningRecord(
            authorization_id=req.auth_id,
            predicted_status=status,
            approval_probability=prob,
            features=json.dumps(result["details"]["risk_prediction"].get("feature_values", {})),
        ))
        db.commit()

        result["status"] = final_status
        result["reprocessed"] = True
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reprocess error [{req.auth_id}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Reprocess error: {e}")
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# DOCUMENTS — List docs for an auth with verification status
# ══════════════════════════════════════════════════════════════

@app.get("/api/documents/{auth_id}")
async def get_documents(auth_id: str, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")

        uid = int(user["sub"])
        role = user["role"]
        # Access control
        if role == ROLE_PATIENT and auth.patient_id != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        if role == ROLE_DOCTOR and auth.assigned_doctor_id != uid:
            raise HTTPException(status_code=403, detail="Not assigned to this case")
        if role == ROLE_INSURANCE and auth.status != STATUS_FINALIZED:
            raise HTTPException(status_code=403, detail="Case not finalized")

        docs = db.query(Document).filter(Document.auth_id == auth_id).all()
        return {
            "auth_id": auth_id,
            "document_count": len(docs),
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "uploaded_by": d.uploaded_by,
                    "uploader_role": d.uploader_role,
                    "verified_status": d.verified_status,
                    "verified_by": d.verified_by,
                    "rejection_reason": d.rejection_reason,
                    "file_size": d.file_size,
                    "created_at": d.created_at.isoformat() if d.created_at else "",
                }
                for d in docs
            ],
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# CASE LIST ENDPOINTS — Role-scoped
# ══════════════════════════════════════════════════════════════

def _auth_to_case_item(a, db) -> dict:
    docs = db.query(Document).filter(Document.auth_id == a.auth_id).all()
    pending = sum(1 for d in docs if d.verified_status == DOC_PENDING)
    return {
        "authorization_id": a.auth_id,
        "patient_name": a.patient_name or "Unknown",
        "status": a.status or "PROCESSING",
        "workflow_stage": a.workflow_stage or "UPLOAD",
        "confidence_score": a.confidence_score or 0,
        "approval_probability": a.approval_probability or 0.0,
        "document_count": len(docs),
        "pending_docs": pending,
        "filename": a.filename or "",
        "patient_id": a.patient_id,
        "assigned_doctor_id": a.assigned_doctor_id,
        "created_at": a.created_at.isoformat() if a.created_at else "",
    }


@app.get("/api/patient/cases")
async def patient_cases(user=Depends(require_role(ROLE_PATIENT))):
    """Patient sees ONLY their own cases."""
    uid = int(user["sub"])
    db = SessionLocal()
    try:
        auths = db.query(Authorization).filter(
            Authorization.patient_id == uid
        ).order_by(Authorization.created_at.desc()).all()
        return [_auth_to_case_item(a, db) for a in auths]
    finally:
        db.close()


@app.get("/api/doctor/cases")
async def doctor_cases(user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN))):
    """Doctor sees ONLY their assigned cases. Admin sees all."""
    uid = int(user["sub"])
    db = SessionLocal()
    try:
        query = db.query(Authorization)
        if user["role"] == ROLE_DOCTOR:
            query = query.filter(Authorization.assigned_doctor_id == uid)
        auths = query.order_by(Authorization.created_at.desc()).all()
        return [_auth_to_case_item(a, db) for a in auths]
    finally:
        db.close()


@app.get("/api/insurance/cases")
async def insurance_cases(user=Depends(require_role(ROLE_INSURANCE, ROLE_ADMIN))):
    """Insurance sees ONLY FINALIZED cases."""
    db = SessionLocal()
    try:
        auths = db.query(Authorization).filter(
            Authorization.status == STATUS_FINALIZED
        ).order_by(Authorization.created_at.desc()).all()
        return [_auth_to_case_item(a, db) for a in auths]
    finally:
        db.close()


@app.post("/api/insurance/remarks")
async def insurance_remarks(
    req: InsuranceRemarksRequest,
    user=Depends(require_role(ROLE_INSURANCE, ROLE_ADMIN)),
):
    """Insurance adds optional remarks/notes to a finalized case."""
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if auth.status != STATUS_FINALIZED and user["role"] == ROLE_INSURANCE:
            raise HTTPException(status_code=400, detail="Can only add remarks to FINALIZED cases")
        auth.insurance_remarks = req.remarks
        db.commit()
        return {"auth_id": req.auth_id, "remarks": req.remarks, "status": "saved"}
    finally:
        db.close()


@app.get("/api/admin/users")
async def admin_users(user=Depends(require_role(ROLE_ADMIN))):
    """Admin views all users."""
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        return [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role,
             "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else ""}
            for u in users
        ]
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PREDICT
# ══════════════════════════════════════════════════════════════

@app.post("/api/predict")
async def predict(req: PredictRequest, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if not auth.result_data:
            raise HTTPException(status_code=400, detail="No analysis results available")
        result = json.loads(auth.result_data)
        risk = result.get("details", {}).get("risk_prediction", {})
        return {
            "authorization_id": req.authorization_id,
            "approval_probability": risk.get("approval_probability", 0),
            "confidence_interval": risk.get("confidence_interval", [0, 0]),
            "feature_importance": risk.get("feature_importance", {}),
            "risk_category": risk.get("risk_category", "Unknown"),
            "explanation": risk.get("explanation", ""),
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# SUBMIT
# ══════════════════════════════════════════════════════════════

@app.post("/api/submit")
async def submit(req: SubmitRequest, user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN))):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if auth.status not in (STATUS_APPROVED, STATUS_FINALIZED):
            raise HTTPException(status_code=400, detail=f"Cannot submit — status is '{auth.status}'")

        result = json.loads(auth.result_data) if auth.result_data else {}
        submission = result.get("details", {}).get("submission") or {}

        if not submission.get("fhir_bundle"):
            details = result.get("details", {})
            submission = generate_fhir_bundle(
                details.get("clinical_data", {}), details.get("evidence_data", {}),
                details.get("policy_data", {}), details.get("risk_prediction", {}),
                req.authorization_id,
            )

        payer_response = simulate_claim_response(
            submission.get("fhir_bundle", {}), auth.approval_probability or 0.5
        )
        log_agent_event(req.authorization_id, "Submission Agent", "fhir_submit", "completed",
                       output_summary=f"Payer: {payer_response.get('disposition','?')}")

        return {
            "authorization_id": req.authorization_id,
            "fhir_bundle": submission.get("fhir_bundle", {}),
            "submission_status": "submitted",
            "payer_response": payer_response,
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# APPEAL
# ══════════════════════════════════════════════════════════════

@app.post("/api/appeal")
async def appeal(req: AppealRequest, user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN))):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")

        result = json.loads(auth.result_data) if auth.result_data else {}
        details = result.get("details", {})

        existing = details.get("appeal")
        if existing and not req.denial_reasons:
            return {
                "authorization_id": req.authorization_id,
                "appeal_letter": existing.get("appeal_letter", ""),
                "counter_arguments": existing.get("counter_arguments", []),
                "supporting_references": existing.get("supporting_references", []),
                "recommended_actions": existing.get("recommended_actions", []),
                "new_status": "APPEALED",
            }

        appeal_data = generate_appeal(
            details.get("clinical_data", {}), details.get("evidence_data", {}),
            details.get("policy_data", {}), details.get("risk_prediction", {}),
            req.denial_reasons or [], req.authorization_id,
        )
        auth.status = STATUS_APPEALED
        auth.appeal_data = json.dumps(appeal_data, default=str)
        result["status"] = STATUS_APPEALED
        result["details"]["appeal"] = appeal_data
        auth.result_data = json.dumps(result, default=str)
        db.commit()

        log_agent_event(req.authorization_id, "Appeal Agent", "appeal_generated", "completed",
                       output_summary=f"Strength: {appeal_data.get('appeal_strength','?')}")
        return {
            "authorization_id": req.authorization_id,
            "appeal_letter": appeal_data.get("appeal_letter", ""),
            "counter_arguments": appeal_data.get("counter_arguments", []),
            "supporting_references": appeal_data.get("supporting_references", []),
            "recommended_actions": appeal_data.get("recommended_actions", []),
            "new_status": STATUS_APPEALED,
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# INSURANCE DECISION
# ══════════════════════════════════════════════════════════════

@app.post("/api/insurance/decide")
async def insurance_decide(req: InsuranceDecisionRequest, user=Depends(require_role(ROLE_INSURANCE, ROLE_ADMIN))):
    if req.decision not in (STATUS_APPROVED, STATUS_DENIED):
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or DENIED")
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        auth.status = req.decision
        result = json.loads(auth.result_data) if auth.result_data else {}
        result["status"] = req.decision
        result["insurance_decision"] = {
            "decision": req.decision, "reason": req.reason,
            "decided_by": user["email"], "decided_at": datetime.datetime.utcnow().isoformat(),
        }
        auth.result_data = json.dumps(result, default=str)
        lr = db.query(LearningRecord).filter(LearningRecord.authorization_id == req.authorization_id).first()
        if lr:
            lr.actual_status = req.decision
        db.commit()
        log_agent_event(req.authorization_id, "Insurance Reviewer", "manual_decision", "completed",
                       output_summary=f"{req.decision} by {user['email']}", user_id=int(user["sub"]))
        return {"authorization_id": req.authorization_id, "new_status": req.decision, "reason": req.reason}
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# HISTORY & AUDIT
# ══════════════════════════════════════════════════════════════

@app.get("/api/history")
async def get_history(limit: int = Query(50), user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        uid = int(user["sub"])
        role = user["role"]
        query = db.query(Authorization).order_by(Authorization.created_at.desc())
        if role == ROLE_PATIENT:
            query = query.filter(Authorization.patient_id == uid)
        elif role == ROLE_DOCTOR:
            query = query.filter(Authorization.assigned_doctor_id == uid)
        elif role == ROLE_INSURANCE:
            query = query.filter(Authorization.status == STATUS_FINALIZED)
        # admin sees all
        rows = query.limit(limit).all()
        return [
            {
                "authorization_id": r.auth_id, "filename": r.filename or "",
                "patient_name": r.patient_name or "Unknown", "status": r.status or "PENDING",
                "workflow_stage": r.workflow_stage or "UPLOAD",
                "confidence_score": r.confidence_score or 0,
                "approval_probability": r.approval_probability or 0.0,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ]
    finally:
        db.close()


@app.get("/api/history/{auth_id}")
async def get_history_detail(auth_id: str, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == auth_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        uid = int(user["sub"])
        role = user["role"]
        if role == ROLE_PATIENT and auth.patient_id != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        if role == ROLE_DOCTOR and auth.assigned_doctor_id != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        if role == ROLE_INSURANCE and auth.status != STATUS_FINALIZED:
            raise HTTPException(status_code=403, detail="Case not finalized")
        data = json.loads(auth.result_data) if auth.result_data else {}
        data["workflow_stage"] = auth.workflow_stage
        data["insurance_remarks"] = auth.insurance_remarks
        data["patient_id"] = auth.patient_id
        data["assigned_doctor_id"] = auth.assigned_doctor_id
        return data
    finally:
        db.close()


@app.get("/api/audit")
async def get_audit(
    authorization_id: Optional[str] = Query(None),
    limit: int = Query(100),
    user=Depends(require_role(ROLE_ADMIN, ROLE_INSURANCE)),
):
    return get_audit_logs(authorization_id=authorization_id, limit=limit)


# ══════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════

@app.get("/api/dashboard")
async def dashboard_metrics(user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        uid = int(user["sub"])
        role = user["role"]
        query = db.query(Authorization)
        if role == ROLE_DOCTOR:
            query = query.filter(Authorization.assigned_doctor_id == uid)
        elif role == ROLE_PATIENT:
            query = query.filter(Authorization.patient_id == uid)
        elif role == ROLE_INSURANCE:
            query = query.filter(Authorization.status == STATUS_FINALIZED)

        all_auths = query.all()
        total = len(all_auths)
        approved   = sum(1 for a in all_auths if a.status in (STATUS_APPROVED, STATUS_FINALIZED))
        denied     = sum(1 for a in all_auths if a.status == STATUS_DENIED)
        incomplete = sum(1 for a in all_auths if a.status == STATUS_INCOMPLETE)
        appealed   = sum(1 for a in all_auths if a.status == STATUS_APPEALED)
        avg_conf   = sum(a.confidence_score or 0 for a in all_auths) / max(total, 1)

        recent = sorted(all_auths, key=lambda a: a.created_at or datetime.datetime.min, reverse=True)[:10]

        learning_records = db.query(LearningRecord).all()
        correct = sum(1 for lr in learning_records if lr.actual_status and lr.predicted_status == lr.actual_status)
        acc = round(correct / len(learning_records) * 100, 1) if learning_records else 0

        return {
            "total_authorizations": total,
            "approved": approved,
            "denied": denied,
            "incomplete": incomplete,
            "appealed": appealed,
            "approval_rate": round(approved / max(total, 1) * 100, 1),
            "avg_confidence": round(avg_conf, 1),
            "recent_activity": [
                {
                    "authorization_id": a.auth_id,
                    "patient_name": a.patient_name or "Unknown",
                    "status": a.status,
                    "workflow_stage": a.workflow_stage or "UPLOAD",
                    "confidence_score": a.confidence_score or 0,
                    "created_at": a.created_at.isoformat() if a.created_at else "",
                }
                for a in recent
            ],
            "trend_data": [
                {"name": "Approved/Finalized", "value": approved, "color": "#10b981"},
                {"name": "Denied", "value": denied, "color": "#ef4444"},
                {"name": "Incomplete", "value": incomplete, "color": "#f59e0b"},
                {"name": "Appealed", "value": appealed, "color": "#8b5cf6"},
            ],
            "prediction_accuracy": acc,
            "total_learning_records": len(learning_records),
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# FHIR SIMULATION
# ══════════════════════════════════════════════════════════════

@app.post("/api/fhir/ClaimResponse")
async def fhir_claim_response(bundle: dict):
    return simulate_claim_response(bundle)

@app.get("/api/fhir/CoverageEligibility/{patient_id}")
async def fhir_coverage(patient_id: str):
    return simulate_coverage_eligibility(patient_id)


# ══════════════════════════════════════════════════════════════
# APPEAL INITIATION ENDPOINT
# ══════════════════════════════════════════════════════════════
@app.post("/api/appeal/initiate")
def initiate_appeal(
    req: InitiateAppealRequest,
    db = Depends(get_db),
    user: dict = Depends(require_role(ROLE_PATIENT, ROLE_DOCTOR))
):
    case = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if case.status not in [STATUS_DENIED]:
        raise HTTPException(status_code=400, detail="Only DENIED cases can be appealed")
        
    if case.appeal_count >= 3:
        case.status = STATUS_FINAL_DENIED
        db.commit()
        log_agent_event(case.auth_id, "System", "appeal_limit_reached", "completed", output_summary="Case locked at FINAL_DENIED", user_id=user["id"])
        raise HTTPException(status_code=400, detail="Maximum appeals reached (3). Case is locked.")
        
    # Create new case
    new_auth_id = str(uuid.uuid4())
    new_case = Authorization(
        auth_id=new_auth_id,
        created_by=case.created_by,
        patient_id=case.patient_id,
        assigned_doctor_id=case.assigned_doctor_id,
        user_id=case.user_id,
        patient_name=case.patient_name,
        workflow_stage="UPLOAD",
        status=STATUS_INCOMPLETE,
        appeal_count=case.appeal_count + 1,
        parent_case_id=case.auth_id,
        version=case.version + 1
    )
    db.add(new_case)
    
    # Audit log parent
    log_agent_event(case.auth_id, "System", "appeal_initiated", "completed", output_summary=f"Appeal initiated -> new version created: {new_auth_id}", user_id=user["id"])
    
    # Audit log child
    db.commit() # ensure new_case is persistent before logging
    log_agent_event(new_auth_id, "System", "case_created", "started", output_summary=f"Appeal version {new_case.version} created from {case.auth_id}", user_id=user["id"])
    
    return {
        "message": "Appeal initiated successfully",
        "new_case_id": new_auth_id,
        "version": new_case.version,
        "appeal_count": new_case.appeal_count
    }


# ══════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok", "service": APP_NAME, "version": APP_VERSION,
            "timestamp": datetime.datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    return {"message": f"Welcome to {APP_NAME} v{APP_VERSION}", "docs": "/docs"}

# ══════════════════════════════════════════════════════════════
# NOTIFICATIONS ENDPOINT
# ══════════════════════════════════════════════════════════════
@app.get("/api/notifications/{auth_id}", response_model=list[NotificationResponse])
def get_notifications(
    auth_id: str,
    db = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(Notification.auth_id == auth_id).order_by(Notification.sent_at.desc()).all()
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "auth_id": n.auth_id,
            "type": n.type,
            "subject": n.subject,
            "message": n.message,
            "sent_at": n.sent_at.isoformat(),
            "recipient_email": n.recipient_email
        })
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
