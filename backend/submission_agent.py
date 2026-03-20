"""
SureCare AI — Submission Agent
Generates FHIR R4-compatible prior authorization request bundles.
"""
import json
import time
import datetime
import uuid
from typing import Dict, Any


def generate_fhir_bundle(
    clinical_data: Dict[str, Any],
    evidence_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    risk_prediction: Dict[str, Any],
    authorization_id: str = "",
) -> Dict[str, Any]:
    """
    Generate a FHIR R4-compatible Prior Authorization Request Bundle.
    """
    start_time = time.time()
    now = datetime.datetime.utcnow().isoformat() + "Z"
    bundle_id = str(uuid.uuid4())

    # ── Patient Resource ────────────────────────────────────
    patient_resource = {
        "resourceType": "Patient",
        "id": clinical_data.get("patient_id", "unknown"),
        "name": [
            {
                "use": "official",
                "text": clinical_data.get("patient_name", "Unknown Patient"),
            }
        ],
        "gender": clinical_data.get("gender", "unknown").lower(),
        "birthDate": clinical_data.get("dob", ""),
    }

    # ── Practitioner Resource ───────────────────────────────
    practitioner_resource = {
        "resourceType": "Practitioner",
        "id": f"pract-{uuid.uuid4().hex[:8]}",
        "name": [
            {
                "use": "official",
                "text": clinical_data.get("requesting_provider", "Unknown Provider"),
            }
        ],
    }

    # ── Organization Resource ───────────────────────────────
    organization_resource = {
        "resourceType": "Organization",
        "id": f"org-{uuid.uuid4().hex[:8]}",
        "name": clinical_data.get("facility_name", "Unknown Facility"),
        "type": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/organization-type", "code": "prov", "display": "Healthcare Provider"}]}],
    }

    # ── Condition Resource ──────────────────────────────────
    icd_codes = clinical_data.get("icd_codes", [])
    condition_resource = {
        "resourceType": "Condition",
        "id": f"cond-{uuid.uuid4().hex[:8]}",
        "subject": {"reference": f"Patient/{patient_resource['id']}"},
        "code": {
            "coding": [
                {
                    "system": "http://hl7.org/fhir/sid/icd-10-cm",
                    "code": code,
                    "display": clinical_data.get("diagnosis", ""),
                }
                for code in icd_codes
            ],
            "text": clinical_data.get("diagnosis", ""),
        },
        "clinicalStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
        },
    }

    # ── Claim Resource (Prior Authorization) ────────────────
    cpt_codes = clinical_data.get("cpt_codes", [])
    claim_items = []
    for i, cpt in enumerate(cpt_codes):
        claim_items.append({
            "sequence": i + 1,
            "productOrService": {
                "coding": [
                    {
                        "system": "http://www.ama-assn.org/go/cpt",
                        "code": cpt,
                        "display": clinical_data.get("treatment", ""),
                    }
                ]
            },
            "diagnosis": [{"diagnosisSequence": [1]}],
        })

    claim_resource = {
        "resourceType": "Claim",
        "id": f"claim-{authorization_id or uuid.uuid4().hex[:8]}",
        "status": "active",
        "type": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional"}]
        },
        "use": "preauthorization",
        "patient": {"reference": f"Patient/{patient_resource['id']}"},
        "created": now,
        "provider": {"reference": f"Practitioner/{practitioner_resource['id']}"},
        "priority": {"coding": [{"code": policy_data.get("priority_level", "normal").lower()}]},
        "diagnosis": [
            {
                "sequence": 1,
                "diagnosisCodeableConcept": {
                    "coding": [
                        {"system": "http://hl7.org/fhir/sid/icd-10-cm", "code": code}
                        for code in icd_codes
                    ]
                },
            }
        ],
        "item": claim_items,
        "supportingInfo": [
            {
                "sequence": 1,
                "category": {"coding": [{"code": "clinical-evidence"}]},
                "valueString": json.dumps({
                    "evidence_score": evidence_data.get("evidence_score", 0),
                    "diagnosis_supported": evidence_data.get("diagnosis_supported", False),
                    "treatment_supported": evidence_data.get("treatment_supported", False),
                }),
            },
            {
                "sequence": 2,
                "category": {"coding": [{"code": "risk-assessment"}]},
                "valueString": json.dumps({
                    "approval_probability": risk_prediction.get("approval_probability", 0),
                    "risk_category": risk_prediction.get("risk_category", "Unknown"),
                }),
            },
        ],
    }

    # ── Full Bundle ─────────────────────────────────────────
    fhir_bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "collection",
        "timestamp": now,
        "meta": {
            "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-request-bundle"],
            "tag": [{"system": "surecare-ai", "code": authorization_id}],
        },
        "entry": [
            {"fullUrl": f"urn:uuid:{uuid.uuid4()}", "resource": patient_resource},
            {"fullUrl": f"urn:uuid:{uuid.uuid4()}", "resource": practitioner_resource},
            {"fullUrl": f"urn:uuid:{uuid.uuid4()}", "resource": organization_resource},
            {"fullUrl": f"urn:uuid:{uuid.uuid4()}", "resource": condition_resource},
            {"fullUrl": f"urn:uuid:{uuid.uuid4()}", "resource": claim_resource},
        ],
    }

    return {
        "fhir_bundle_type": "Prior Authorization Request (PAS)",
        "fhir_version": "R4",
        "bundle_id": bundle_id,
        "fhir_bundle": fhir_bundle,
        "resource_count": len(fhir_bundle["entry"]),
        "status": "Ready for submission",
        "authorization_id": authorization_id,
        "_generation_time_ms": int((time.time() - start_time) * 1000),
    }
