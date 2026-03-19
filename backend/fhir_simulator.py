"""
SureCare AI — Mock FHIR R4 API Simulator
Simulates payer ClaimResponse with configurable approval logic.
"""
import random
import time
import uuid
import datetime
from typing import Dict, Any


# Configurable simulation parameters
SIMULATED_DENIAL_RATE = 0.25  # 25% base denial rate
SIMULATED_PROCESSING_DELAY_MS = 500  # Simulated processing latency


def simulate_claim_response(
    fhir_bundle: Dict[str, Any],
    approval_probability: float = 0.5,
) -> Dict[str, Any]:
    """
    Simulate a FHIR R4 ClaimResponse from a payer.
    Uses the approval_probability to determine outcome with some randomization.
    """
    start_time = time.time()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    response_id = str(uuid.uuid4())

    # Decision logic: combine ML prediction with randomization
    random_factor = random.uniform(-0.1, 0.1)
    adjusted_prob = max(0.0, min(1.0, approval_probability + random_factor))

    if adjusted_prob >= 0.65:
        disposition = "approved"
        outcome = "complete"
        decision_text = "Prior authorization request has been approved. The requested service meets medical necessity criteria and is covered under the patient's current benefit plan."
    elif adjusted_prob >= 0.40:
        disposition = "pended"
        outcome = "queued"
        decision_text = "Prior authorization request requires additional review. The case has been forwarded to a medical director for peer review. Please allow 5-7 business days for processing."
    else:
        disposition = "denied"
        outcome = "error"
        decision_text = "Prior authorization request has been denied. The requested service does not meet the medical necessity criteria as defined by the payer's clinical guidelines. An appeal may be submitted within 30 days."

    # Extract claim ID from bundle
    claim_id = "unknown"
    if isinstance(fhir_bundle, dict):
        entries = fhir_bundle.get("entry", [])
        for entry in entries:
            res = entry.get("resource", {})
            if res.get("resourceType") == "Claim":
                claim_id = res.get("id", "unknown")
                break

    claim_response = {
        "resourceType": "ClaimResponse",
        "id": response_id,
        "status": "active",
        "type": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                    "code": "professional",
                }
            ]
        },
        "use": "preauthorization",
        "patient": fhir_bundle.get("entry", [{}])[0].get("resource", {}).get("id", "unknown") if fhir_bundle.get("entry") else "unknown",
        "created": now,
        "insurer": {
            "reference": "Organization/payer-surecare",
            "display": "SureCare Insurance Co.",
        },
        "request": {"reference": f"Claim/{claim_id}"},
        "outcome": outcome,
        "disposition": decision_text,
        "preAuthRef": [f"PA-{uuid.uuid4().hex[:12].upper()}"],
        "processNote": [
            {
                "number": 1,
                "type": {"coding": [{"code": "display"}]},
                "text": decision_text,
                "time": now,
            }
        ],
    }

    # Add adjudication details
    if disposition == "approved":
        claim_response["adjudication"] = [
            {
                "category": {"coding": [{"code": "benefit"}]},
                "reason": {"coding": [{"code": "AR", "display": "Authorized"}]},
            }
        ]
    elif disposition == "denied":
        claim_response["adjudication"] = [
            {
                "category": {"coding": [{"code": "denial"}]},
                "reason": {
                    "coding": [
                        {
                            "code": "NMN",
                            "display": "Not Medically Necessary",
                        }
                    ]
                },
            }
        ]

    return {
        "claim_response": claim_response,
        "disposition": disposition,
        "decision_text": decision_text,
        "pre_auth_reference": claim_response["preAuthRef"][0],
        "processing_time_ms": int((time.time() - start_time) * 1000),
        "simulated": True,
    }


def simulate_coverage_eligibility(patient_id: str = "") -> Dict[str, Any]:
    """Simulate a FHIR CoverageEligibilityResponse."""
    return {
        "resourceType": "CoverageEligibilityResponse",
        "id": str(uuid.uuid4()),
        "status": "active",
        "purpose": ["auth-requirements"],
        "patient": {"reference": f"Patient/{patient_id}"},
        "created": datetime.datetime.utcnow().isoformat() + "Z",
        "insurer": {"reference": "Organization/payer-surecare", "display": "SureCare Insurance Co."},
        "insurance": [
            {
                "coverage": {"reference": "Coverage/commercial-standard"},
                "inforce": True,
                "item": [
                    {
                        "category": {"coding": [{"code": "professional"}]},
                        "network": {"coding": [{"code": "in", "display": "In Network"}]},
                        "benefit": [
                            {
                                "type": {"coding": [{"code": "benefit"}]},
                                "allowedMoney": {"value": 250000, "currency": "USD"},
                            }
                        ],
                        "authorizationRequired": True,
                    }
                ],
            }
        ],
    }
