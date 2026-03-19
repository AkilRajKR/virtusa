"""
SureCare AI — Main Application & REST API Routes
FastAPI orchestrator with JWT auth, role-based access, pipeline execution, and all endpoints.
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
    ROLE_DOCTOR, ROLE_INSURANCE, ROLE_ADMIN,
)
from database import (
    init_db, get_db, SessionLocal, User, Authorization, AuditLog,
    LearningRecord, pwd_context,
)
from models import (
    LoginRequest, RegisterRequest, AuthResponse,
    AnalysisResult, PipelineState,
    PredictRequest, PredictResponse,
    SubmitRequest, SubmitResponse,
    AppealRequest, AppealResponse,
    DashboardMetrics, InsuranceDecisionRequest,
)
from clinical_reader_agent import extract_clinical_data, validate_clinical_completeness
from evidence_builder_agent import validate_evidence
from policy_intelligence_agent import compare_against_policy
from risk_prediction_agent import predict_approval
from submission_agent import generate_fhir_bundle
from appeal_agent import generate_appeal
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
    logger.info("Database initialized with default users")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI-Driven Prior Authorization System with Multi-Agent Pipeline",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory document store ────────────────────────────────
# Maps document_id -> {filename, text, pages, path}
uploaded_documents = {}


# ══════════════════════════════════════════════════════════════
# AUTH HELPERS
# ══════════════════════════════════════════════════════════════

def create_token(user_id: int, email: str, role: str, name: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "name": name,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


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
    """Dependency factory for role-based access control."""
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user['role']}",
            )
        return user
    return role_checker


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
        token = create_token(user.id, user.email, user.role, user.name)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
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
        user = User(
            email=req.email,
            name=req.name,
            hashed_password=pwd_context.hash(req.password),
            role=req.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_token(user.id, user.email, user.role, user.name)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# UPLOAD ENDPOINT (Doctor only)
# ══════════════════════════════════════════════════════════════

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    try:
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF contains no extractable text")

    doc_id = f"DOC-{uuid.uuid4().hex[:12].upper()}"

    # Save file to disk
    filepath = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    with open(filepath, "wb") as f:
        f.write(content)

    # Store in memory
    uploaded_documents[doc_id] = {
        "filename": file.filename,
        "text": text,
        "pages": len(pdf.pages),
        "path": filepath,
        "uploaded_by": int(user["sub"]),
        "uploaded_at": datetime.datetime.utcnow().isoformat(),
    }

    logger.info(f"Document uploaded: {doc_id} ({file.filename}, {len(pdf.pages)} pages)")

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "text_preview": text[:300] + "..." if len(text) > 300 else text,
        "page_count": len(pdf.pages),
        "character_count": len(text),
    }


# ══════════════════════════════════════════════════════════════
# ANALYZE ENDPOINT — Full Pipeline (Doctor)
# ══════════════════════════════════════════════════════════════

@app.post("/api/analyze")
async def analyze_document(
    file: UploadFile = File(None),
    document_id: str = Form(None),
    user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN)),
):
    user_id = int(user["sub"])

    # Get text from uploaded doc or direct file
    if document_id and document_id in uploaded_documents:
        doc = uploaded_documents[document_id]
        text = doc["text"]
        filename = doc["filename"]
    elif file:
        content = await file.read()
        try:
            pdf = PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            filename = file.filename
            document_id = f"DOC-{uuid.uuid4().hex[:12].upper()}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Provide document_id or upload a file")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the document")

    auth_id = f"AUTH-{datetime.datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"
    pipeline_state = {
        "clinical_reader": "pending",
        "evidence_builder": "pending",
        "policy_intelligence": "pending",
        "risk_prediction": "pending",
        "submission": "pending",
        "appeal": "pending",
    }

    db = SessionLocal()
    try:
        # Create authorization record
        auth_record = Authorization(
            auth_id=auth_id,
            user_id=user_id,
            filename=filename,
            status="PROCESSING",
            pipeline_state=json.dumps(pipeline_state),
        )
        db.add(auth_record)
        db.commit()

        # ── AGENT 1: Clinical Reader ───────────────────────
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

        # Check for incomplete data
        missing_fields = completeness.get("missing_fields", [])

        # ── AGENT 2: Evidence Builder ──────────────────────
        pipeline_state["evidence_builder"] = "running"
        log_agent_event(auth_id, "Evidence Builder", "validate_evidence", "started", user_id=user_id)

        t0 = time.time()
        evidence_data = validate_evidence(clinical_data, text)
        t1 = time.time()

        pipeline_state["evidence_builder"] = "completed"
        log_agent_event(auth_id, "Evidence Builder", "validate_evidence", "completed",
                       output_summary=f"Score: {evidence_data.get('evidence_score',0)}, DxSupported: {evidence_data.get('diagnosis_supported', False)}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        # ── AGENT 3: Policy Intelligence ───────────────────
        pipeline_state["policy_intelligence"] = "running"
        log_agent_event(auth_id, "Policy Intelligence", "compare_against_policy", "started", user_id=user_id)

        t0 = time.time()
        policy_data = compare_against_policy(clinical_data, evidence_data)
        t1 = time.time()

        pipeline_state["policy_intelligence"] = "completed"
        log_agent_event(auth_id, "Policy Intelligence", "compare_against_policy", "completed",
                       output_summary=f"Match: {policy_data.get('policy_match', False)}, Coverage: {policy_data.get('coverage_status','?')}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        # ── AGENT 4: Risk Prediction ──────────────────────
        pipeline_state["risk_prediction"] = "running"
        log_agent_event(auth_id, "Risk Prediction", "predict_approval", "started", user_id=user_id)

        t0 = time.time()
        risk_data = predict_approval(clinical_data, evidence_data, policy_data)
        t1 = time.time()

        pipeline_state["risk_prediction"] = "completed"
        log_agent_event(auth_id, "Risk Prediction", "predict_approval", "completed",
                       output_summary=f"Probability: {risk_data.get('approval_probability',0):.2%}, Category: {risk_data.get('risk_category','?')}",
                       duration_ms=int((t1-t0)*1000), user_id=user_id)

        approval_probability = risk_data.get("approval_probability", 0)
        confidence_score = int(approval_probability * 100)

        # ── Decision Routing ──────────────────────────────
        all_missing = missing_fields + evidence_data.get("missing_documents", []) + policy_data.get("violations", [])

        if completeness.get("completeness_score", 0) < 40 or len(missing_fields) >= 3:
            status = "INCOMPLETE"
            explanation = f"Insufficient clinical data. Missing: {', '.join(missing_fields)}. Manual review required."
            pipeline_state["submission"] = "skipped"
            pipeline_state["appeal"] = "skipped"
            log_agent_event(auth_id, "Orchestrator", "decision_routing", "completed",
                           output_summary=f"Status: INCOMPLETE — missing {len(missing_fields)} fields", user_id=user_id)
        elif approval_probability >= 0.60 and policy_data.get("policy_match", False):
            status = "APPROVED"
            explanation = risk_data.get("explanation", "Authorization approved based on clinical evidence and policy compliance.")

            # ── AGENT 5a: Submission ──────────────────────
            pipeline_state["submission"] = "running"
            log_agent_event(auth_id, "Submission Agent", "generate_fhir_bundle", "started", user_id=user_id)

            t0 = time.time()
            submission_data = generate_fhir_bundle(clinical_data, evidence_data, policy_data, risk_data, auth_id)
            t1 = time.time()

            pipeline_state["submission"] = "completed"
            pipeline_state["appeal"] = "not_needed"
            log_agent_event(auth_id, "Submission Agent", "generate_fhir_bundle", "completed",
                           output_summary=f"Bundle generated with {submission_data.get('resource_count', 0)} resources",
                           duration_ms=int((t1-t0)*1000), user_id=user_id)
        else:
            status = "DENIED"
            explanation = risk_data.get("explanation", "Authorization denied due to policy non-compliance or insufficient evidence.")
            pipeline_state["submission"] = "not_applicable"

            # ── AGENT 5b: Appeal ──────────────────────────
            pipeline_state["appeal"] = "running"
            log_agent_event(auth_id, "Appeal Agent", "generate_appeal", "started", user_id=user_id)

            t0 = time.time()
            denial_reasons = policy_data.get("violations", []) + evidence_data.get("missing_documents", [])
            appeal_data = generate_appeal(clinical_data, evidence_data, policy_data, risk_data, denial_reasons, auth_id)
            t1 = time.time()

            pipeline_state["appeal"] = "completed"
            log_agent_event(auth_id, "Appeal Agent", "generate_appeal", "completed",
                           output_summary=f"Appeal generated, strength: {appeal_data.get('appeal_strength','?')}",
                           duration_ms=int((t1-t0)*1000), user_id=user_id)

        # ── Build final result ─────────────────────────────
        audit_trail = build_audit_trail_for_auth(auth_id)

        result = {
            "authorization_id": auth_id,
            "status": status,
            "approval_probability": approval_probability,
            "confidence_score": confidence_score,
            "explanation": explanation,
            "missing_fields": missing_fields,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "pipeline_summary": f"Document processed through {sum(1 for v in pipeline_state.values() if v == 'completed')} AI agent nodes.",
            "pipeline_state": pipeline_state,
            "details": {
                "clinical_data": clinical_data,
                "evidence_data": evidence_data,
                "policy_data": policy_data,
                "risk_prediction": risk_data,
                "submission": submission_data if status == "APPROVED" else None,
                "appeal": appeal_data if status == "DENIED" else None,
            },
            "audit_trail": audit_trail,
        }

        # Update authorization record
        auth_record.status = status
        auth_record.patient_name = clinical_data.get("patient_name", "Unknown")
        auth_record.approval_probability = approval_probability
        auth_record.confidence_score = confidence_score
        auth_record.result_data = json.dumps(result, default=str)
        auth_record.pipeline_state = json.dumps(pipeline_state)
        if status == "APPROVED" and 'submission_data' in dir():
            auth_record.fhir_bundle = json.dumps(submission_data, default=str)
        if status == "DENIED" and 'appeal_data' in dir():
            auth_record.appeal_data = json.dumps(appeal_data, default=str)
        db.commit()

        # Store learning record
        learning = LearningRecord(
            authorization_id=auth_id,
            predicted_status=status,
            approval_probability=approval_probability,
            features=json.dumps(risk_data.get("feature_values", {})),
        )
        db.add(learning)
        db.commit()

        logger.info(f"Pipeline complete: {auth_id} → {status} ({confidence_score}%)")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        log_agent_event(auth_id, "Orchestrator", "pipeline_error", "failed",
                       output_summary=str(e), user_id=user_id)
        raise HTTPException(status_code=500, detail=f"Pipeline processing error: {str(e)}")
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# PREDICT ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/api/predict")
async def predict(req: PredictRequest, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if not auth.result_data:
            raise HTTPException(status_code=400, detail="No analysis results to predict from")

        result = json.loads(auth.result_data)
        details = result.get("details", {})
        risk = details.get("risk_prediction", {})

        return {
            "authorization_id": req.authorization_id,
            "approval_probability": risk.get("approval_probability", 0),
            "confidence_interval": risk.get("confidence_interval", [0, 0]),
            "feature_importance": risk.get("feature_importance", {}),
            "feature_values": risk.get("feature_values", {}),
            "risk_category": risk.get("risk_category", "Unknown"),
            "explanation": risk.get("explanation", ""),
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# SUBMIT ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/api/submit")
async def submit(req: SubmitRequest, user=Depends(require_role(ROLE_DOCTOR, ROLE_ADMIN))):
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")
        if auth.status != "APPROVED":
            raise HTTPException(status_code=400, detail=f"Cannot submit — status is '{auth.status}', must be 'APPROVED'")

        result = json.loads(auth.result_data) if auth.result_data else {}
        submission = result.get("details", {}).get("submission", {})

        if not submission or not submission.get("fhir_bundle"):
            # Regenerate
            details = result.get("details", {})
            submission = generate_fhir_bundle(
                details.get("clinical_data", {}),
                details.get("evidence_data", {}),
                details.get("policy_data", {}),
                details.get("risk_prediction", {}),
                req.authorization_id,
            )

        # Simulate payer response
        payer_response = simulate_claim_response(
            submission.get("fhir_bundle", {}),
            auth.approval_probability or 0.5,
        )

        log_agent_event(req.authorization_id, "Submission Agent", "fhir_submit", "completed",
                       output_summary=f"Payer response: {payer_response.get('disposition','?')}")

        return {
            "authorization_id": req.authorization_id,
            "fhir_bundle": submission.get("fhir_bundle", {}),
            "submission_status": "submitted",
            "payer_response": payer_response,
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# APPEAL ENDPOINT
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

        # Check if appeal already exists
        existing_appeal = details.get("appeal")
        if existing_appeal and not req.denial_reasons:
            return {
                "authorization_id": req.authorization_id,
                "appeal_letter": existing_appeal.get("appeal_letter", ""),
                "counter_arguments": existing_appeal.get("counter_arguments", []),
                "supporting_references": existing_appeal.get("supporting_references", []),
                "recommended_actions": existing_appeal.get("recommended_actions", []),
                "new_status": "APPEALED",
            }

        # Generate new appeal
        appeal_data = generate_appeal(
            details.get("clinical_data", {}),
            details.get("evidence_data", {}),
            details.get("policy_data", {}),
            details.get("risk_prediction", {}),
            req.denial_reasons or [],
            req.authorization_id,
        )

        # Update record
        auth.status = "APPEALED"
        auth.appeal_data = json.dumps(appeal_data, default=str)
        result["status"] = "APPEALED"
        result["details"]["appeal"] = appeal_data
        auth.result_data = json.dumps(result, default=str)
        db.commit()

        log_agent_event(req.authorization_id, "Appeal Agent", "appeal_generated", "completed",
                       output_summary=f"Appeal strength: {appeal_data.get('appeal_strength','?')}")

        return {
            "authorization_id": req.authorization_id,
            "appeal_letter": appeal_data.get("appeal_letter", ""),
            "counter_arguments": appeal_data.get("counter_arguments", []),
            "supporting_references": appeal_data.get("supporting_references", []),
            "recommended_actions": appeal_data.get("recommended_actions", []),
            "new_status": "APPEALED",
        }
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# INSURANCE DECISION ENDPOINT (Insurance only)
# ══════════════════════════════════════════════════════════════

@app.post("/api/insurance/decide")
async def insurance_decide(req: InsuranceDecisionRequest, user=Depends(require_role(ROLE_INSURANCE, ROLE_ADMIN))):
    if req.decision not in ("APPROVED", "DENIED"):
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVED' or 'DENIED'")
    db = SessionLocal()
    try:
        auth = db.query(Authorization).filter(Authorization.auth_id == req.authorization_id).first()
        if not auth:
            raise HTTPException(status_code=404, detail="Authorization not found")

        auth.status = req.decision
        result = json.loads(auth.result_data) if auth.result_data else {}
        result["status"] = req.decision
        result["insurance_decision"] = {
            "decision": req.decision,
            "reason": req.reason,
            "decided_by": user["email"],
            "decided_at": datetime.datetime.utcnow().isoformat(),
        }
        auth.result_data = json.dumps(result, default=str)

        # Update learning record
        learning = db.query(LearningRecord).filter(LearningRecord.authorization_id == req.authorization_id).first()
        if learning:
            learning.actual_status = req.decision

        db.commit()

        log_agent_event(req.authorization_id, "Insurance Reviewer", "manual_decision", "completed",
                       output_summary=f"Decision: {req.decision} by {user['email']}: {req.reason}",
                       user_id=int(user["sub"]))

        return {"authorization_id": req.authorization_id, "new_status": req.decision, "reason": req.reason}
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════
# HISTORY & AUDIT ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.get("/api/history")
async def get_history(limit: int = Query(50), user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        query = db.query(Authorization).order_by(Authorization.created_at.desc())

        # Role-based filtering
        if user["role"] == ROLE_DOCTOR:
            query = query.filter(Authorization.user_id == int(user["sub"]))
        # Insurance and admin see all

        rows = query.limit(limit).all()
        return [
            {
                "authorization_id": r.auth_id,
                "filename": r.filename or "",
                "patient_name": r.patient_name or "Unknown",
                "status": r.status or "PENDING",
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

        # Doctor can only see own records
        if user["role"] == ROLE_DOCTOR and auth.user_id != int(user["sub"]):
            raise HTTPException(status_code=403, detail="Access denied")

        return json.loads(auth.result_data) if auth.result_data else {"authorization_id": auth_id, "status": auth.status}
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
# DASHBOARD METRICS
# ══════════════════════════════════════════════════════════════

@app.get("/api/dashboard")
async def dashboard_metrics(user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        query = db.query(Authorization)
        if user["role"] == ROLE_DOCTOR:
            query = query.filter(Authorization.user_id == int(user["sub"]))

        all_auths = query.all()
        total = len(all_auths)
        approved = sum(1 for a in all_auths if a.status == "APPROVED")
        denied = sum(1 for a in all_auths if a.status == "DENIED")
        incomplete = sum(1 for a in all_auths if a.status == "INCOMPLETE")
        appealed = sum(1 for a in all_auths if a.status == "APPEALED")

        avg_conf = sum(a.confidence_score or 0 for a in all_auths) / max(total, 1)

        recent = sorted(all_auths, key=lambda a: a.created_at or datetime.datetime.min, reverse=True)[:10]
        recent_activity = [
            {
                "authorization_id": a.auth_id,
                "patient_name": a.patient_name or "Unknown",
                "status": a.status,
                "confidence_score": a.confidence_score or 0,
                "created_at": a.created_at.isoformat() if a.created_at else "",
            }
            for a in recent
        ]

        # Trend data (group by status)
        trend_data = [
            {"name": "Approved", "value": approved, "color": "#10b981"},
            {"name": "Denied", "value": denied, "color": "#ef4444"},
            {"name": "Incomplete", "value": incomplete, "color": "#f59e0b"},
            {"name": "Appealed", "value": appealed, "color": "#8b5cf6"},
        ]

        # Learning loop metrics
        learning_records = db.query(LearningRecord).all()
        prediction_accuracy = 0
        if learning_records:
            correct = sum(1 for lr in learning_records if lr.actual_status and lr.predicted_status == lr.actual_status)
            prediction_accuracy = round(correct / len(learning_records) * 100, 1) if learning_records else 0

        return {
            "total_authorizations": total,
            "approved": approved,
            "denied": denied,
            "incomplete": incomplete,
            "appealed": appealed,
            "approval_rate": round(approved / max(total, 1) * 100, 1),
            "avg_confidence": round(avg_conf, 1),
            "recent_activity": recent_activity,
            "trend_data": trend_data,
            "prediction_accuracy": prediction_accuracy,
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
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

@app.get("/")
async def root():
    return {"message": f"Welcome to {APP_NAME} v{APP_VERSION}", "docs": "/docs"}


# ══════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
