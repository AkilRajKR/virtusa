"""
SureCare AI — Audit Trail Service
Records every agent invocation with timestamps, inputs, outputs, and decision rationale.
"""
import hashlib
import json
import datetime
from typing import Optional
from database import SessionLocal, AuditLog


def _hash_input(data) -> str:
    """Create a short hash of input data for traceability."""
    raw = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def log_agent_event(
    authorization_id: str,
    agent_name: str,
    action: str,
    status: str,
    input_data: Optional[dict] = None,
    output_summary: str = "",
    details: Optional[dict] = None,
    user_id: int = 0,
    duration_ms: int = 0,
):
    """Log a single agent pipeline event."""
    db = SessionLocal()
    try:
        entry = AuditLog(
            authorization_id=authorization_id,
            agent_name=agent_name,
            action=action,
            status=status,
            input_hash=_hash_input(input_data) if input_data else "",
            output_summary=output_summary[:500],
            details=json.dumps(details or {}, default=str),
            user_id=user_id,
            timestamp=datetime.datetime.utcnow(),
            duration_ms=duration_ms,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print(f"[AuditTrail] Error logging event: {e}")
    finally:
        db.close()


def get_audit_logs(authorization_id: Optional[str] = None, limit: int = 100) -> list:
    """Retrieve audit logs, optionally filtered by authorization_id."""
    db = SessionLocal()
    try:
        query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
        if authorization_id:
            query = query.filter(AuditLog.authorization_id == authorization_id)
        rows = query.limit(limit).all()
        return [
            {
                "id": r.id,
                "authorization_id": r.authorization_id,
                "agent_name": r.agent_name,
                "action": r.action,
                "status": r.status,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "duration_ms": r.duration_ms,
                "output_summary": r.output_summary or "",
                "details": json.loads(r.details) if r.details else {},
            }
            for r in rows
        ]
    finally:
        db.close()


def build_audit_trail_for_auth(authorization_id: str) -> list:
    """Build a compact audit trail array for the analysis result."""
    db = SessionLocal()
    try:
        rows = (
            db.query(AuditLog)
            .filter(AuditLog.authorization_id == authorization_id)
            .order_by(AuditLog.timestamp.asc())
            .all()
        )
        return [
            {
                "agent": r.agent_name,
                "action": r.action,
                "status": r.status,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "duration_ms": r.duration_ms,
            }
            for r in rows
        ]
    finally:
        db.close()
