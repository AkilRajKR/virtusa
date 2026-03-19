"""
SureCare AI — Medical Rule Engine
Deterministic ICD/CPT validation, treatment-diagnosis compatibility,
and payer-specific coverage rules.
"""
from typing import Dict, List, Any, Tuple

# ── ICD-10 ↔ CPT Valid Pairs ───────────────────────────────
# Maps ICD-10 diagnosis codes to valid CPT procedure codes
ICD_CPT_VALID_PAIRS = {
    # Diabetes
    "E11.65": ["95249", "95250", "95251", "99213", "99214"],
    "E11.9": ["99213", "99214", "99215", "83036"],
    "E10.9": ["95249", "95250", "99213"],
    # Cardiovascular
    "I25.10": ["93458", "93459", "33533", "92928", "92920"],
    "I21.9": ["92928", "93458", "99291"],
    "I48.91": ["33254", "93656", "93653"],
    # Orthopedic
    "M17.11": ["27447", "27446", "20610", "99213"],
    "M17.12": ["27447", "27446", "20610"],
    "M54.5": ["22612", "22630", "62323", "99213", "99214"],
    "M51.16": ["63030", "63047", "62323"],
    # Oncology
    "C34.90": ["32480", "32663", "77386", "96413"],
    "C50.911": ["19301", "19303", "77386", "96413"],
    "C18.9": ["44204", "44205", "96413"],
    # Mental Health
    "F32.1": ["90834", "90837", "90847", "99213"],
    "F41.1": ["90834", "90837", "90847"],
    # Respiratory
    "J44.1": ["94010", "94060", "31624", "99213"],
    "J45.50": ["94010", "94060", "94726"],
    # Neurological
    "G20": ["95819", "95816", "99213", "99214"],
    "G43.909": ["64615", "99213", "99214"],
    # Renal
    "N18.6": ["90935", "90937", "36821"],
}

# ── Treatment-Diagnosis Compatibility ──────────────────────
TREATMENT_DIAGNOSIS_MAP = {
    "insulin pump therapy": ["E11.65", "E10.9", "E11.9"],
    "coronary artery bypass": ["I25.10", "I21.9"],
    "cardiac catheterization": ["I25.10", "I21.9", "I48.91"],
    "total knee replacement": ["M17.11", "M17.12"],
    "spinal fusion": ["M54.5", "M51.16"],
    "lumbar discectomy": ["M51.16", "M54.5"],
    "chemotherapy": ["C34.90", "C50.911", "C18.9"],
    "mastectomy": ["C50.911"],
    "radiation therapy": ["C34.90", "C50.911", "C18.9"],
    "cognitive behavioral therapy": ["F32.1", "F41.1"],
    "dialysis": ["N18.6"],
    "botox injection": ["G43.909"],
    "mri scan": ["M54.5", "M51.16", "G20", "G43.909", "C34.90"],
    "ct scan": ["C34.90", "C18.9", "I25.10", "M54.5"],
    "pulmonary function test": ["J44.1", "J45.50"],
}

# ── Payer Policy Rules ─────────────────────────────────────
PAYER_POLICIES = {
    "medicare": {
        "name": "Medicare",
        "pre_auth_required": ["27447", "33533", "22612", "22630", "63030", "44204", "19303"],
        "auto_approve_cpt": ["99213", "99214", "90834", "83036"],
        "max_coverage_amount": 100000,
        "required_documentation": ["clinical_notes", "lab_results", "imaging"],
        "waiting_period_days": 0,
    },
    "medicaid": {
        "name": "Medicaid",
        "pre_auth_required": ["27447", "33533", "22612", "63030", "44204", "19303", "32480", "95249"],
        "auto_approve_cpt": ["99213", "90834"],
        "max_coverage_amount": 75000,
        "required_documentation": ["clinical_notes", "lab_results", "imaging", "prior_treatment_records"],
        "waiting_period_days": 14,
    },
    "commercial": {
        "name": "Commercial Insurance",
        "pre_auth_required": ["27447", "33533", "22612", "63030", "44204", "19303", "32480", "95249", "92928"],
        "auto_approve_cpt": ["99213", "99214", "90834", "83036", "94010"],
        "max_coverage_amount": 250000,
        "required_documentation": ["clinical_notes", "lab_results"],
        "waiting_period_days": 7,
    },
}


def validate_icd_cpt_pair(icd_codes: List[str], cpt_codes: List[str]) -> Dict[str, Any]:
    """Validate ICD-10 and CPT code pairs."""
    valid_pairs = []
    invalid_pairs = []
    unrecognized_codes = []

    for icd in icd_codes:
        icd_upper = icd.upper().strip()
        if icd_upper not in ICD_CPT_VALID_PAIRS:
            unrecognized_codes.append(icd_upper)
            continue
        allowed_cpts = ICD_CPT_VALID_PAIRS[icd_upper]
        for cpt in cpt_codes:
            cpt_clean = cpt.strip()
            if cpt_clean in allowed_cpts:
                valid_pairs.append({"icd": icd_upper, "cpt": cpt_clean, "valid": True})
            else:
                invalid_pairs.append({"icd": icd_upper, "cpt": cpt_clean, "valid": False})

    return {
        "valid_pairs": valid_pairs,
        "invalid_pairs": invalid_pairs,
        "unrecognized_codes": unrecognized_codes,
        "all_valid": len(invalid_pairs) == 0 and len(unrecognized_codes) == 0,
        "validity_score": (
            len(valid_pairs) / max(len(valid_pairs) + len(invalid_pairs), 1) * 100
        ),
    }


def check_treatment_diagnosis_compatibility(treatment: str, icd_codes: List[str]) -> Dict[str, Any]:
    """Check if the treatment is compatible with the given diagnosis codes."""
    treatment_lower = treatment.lower().strip()
    compatible = False
    matched_codes = []

    for key, valid_icds in TREATMENT_DIAGNOSIS_MAP.items():
        if key in treatment_lower:
            for icd in icd_codes:
                if icd.upper().strip() in valid_icds:
                    compatible = True
                    matched_codes.append(icd.upper().strip())

    return {
        "compatible": compatible,
        "treatment": treatment,
        "matched_icd_codes": matched_codes,
        "recommendation": "Treatment is clinically appropriate for the diagnosis." if compatible
        else "Treatment may not align with the documented diagnosis codes. Manual review recommended.",
    }


def evaluate_payer_policy(
    cpt_codes: List[str], payer_type: str = "commercial"
) -> Dict[str, Any]:
    """Evaluate coverage based on payer-specific policy rules."""
    policy = PAYER_POLICIES.get(payer_type, PAYER_POLICIES["commercial"])

    requires_pre_auth = []
    auto_approved = []
    not_recognized = []

    for cpt in cpt_codes:
        cpt_clean = cpt.strip()
        if cpt_clean in policy["auto_approve_cpt"]:
            auto_approved.append(cpt_clean)
        elif cpt_clean in policy["pre_auth_required"]:
            requires_pre_auth.append(cpt_clean)
        else:
            not_recognized.append(cpt_clean)

    return {
        "payer": policy["name"],
        "requires_pre_authorization": requires_pre_auth,
        "auto_approved": auto_approved,
        "not_in_policy": not_recognized,
        "required_documentation": policy["required_documentation"],
        "max_coverage": policy["max_coverage_amount"],
        "waiting_period_days": policy["waiting_period_days"],
        "pre_auth_needed": len(requires_pre_auth) > 0,
    }


def run_full_rule_engine(
    icd_codes: List[str],
    cpt_codes: List[str],
    treatment: str,
    payer_type: str = "commercial",
) -> Dict[str, Any]:
    """Run the complete medical rule engine evaluation."""
    code_validation = validate_icd_cpt_pair(icd_codes, cpt_codes)
    compatibility = check_treatment_diagnosis_compatibility(treatment, icd_codes)
    payer_eval = evaluate_payer_policy(cpt_codes, payer_type)

    # Compute overall rule engine score
    scores = []
    if code_validation["all_valid"]:
        scores.append(100)
    else:
        scores.append(code_validation["validity_score"])
    scores.append(100 if compatibility["compatible"] else 30)
    scores.append(100 if not payer_eval.get("not_in_policy") else 60)

    overall_score = sum(scores) / len(scores)

    return {
        "code_validation": code_validation,
        "treatment_compatibility": compatibility,
        "payer_evaluation": payer_eval,
        "overall_rule_score": round(overall_score, 1),
        "rule_engine_pass": overall_score >= 70,
    }
