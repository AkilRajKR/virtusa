"""
SureCare AI — Risk Prediction Agent
ML-based approval probability prediction with feature importance for explainability.
Uses a weighted logistic-style scoring model with configurable features.
"""
import math
import time
from typing import Dict, Any, List


# ── Feature Weights (simulates a trained logistic regression model) ──
FEATURE_WEIGHTS = {
    "evidence_score": 0.25,
    "policy_match": 0.22,
    "code_validity": 0.18,
    "treatment_compatibility": 0.12,
    "documentation_quality": 0.10,
    "risk_severity": 0.08,
    "completeness": 0.05,
}

MODEL_BIAS = 0.15  # Base probability offset


def predict_approval(
    clinical_data: Dict[str, Any],
    evidence_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    rule_engine_data: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """
    Predict approval probability using a weighted scoring model.
    Returns probability, confidence interval, feature importance, and explanation.
    """
    start_time = time.time()

    # ── Feature Extraction ──────────────────────────────────
    features = {}

    # 1. Evidence Score (0-1)
    evidence_score_raw = evidence_data.get("evidence_score", 0)
    features["evidence_score"] = min(evidence_score_raw / 100.0, 1.0)

    # 2. Policy Match (0 or 1)
    features["policy_match"] = 1.0 if policy_data.get("policy_match", False) else 0.0

    # 3. Code Validity (0-1 from rule engine)
    if rule_engine_data:
        code_val = rule_engine_data.get("code_validation", {})
        features["code_validity"] = code_val.get("validity_score", 0) / 100.0
    else:
        re_data = policy_data.get("rule_engine", {})
        code_val = re_data.get("code_validation", {})
        features["code_validity"] = code_val.get("validity_score", 50) / 100.0

    # 4. Treatment Compatibility (0 or 1)
    if rule_engine_data:
        compat = rule_engine_data.get("treatment_compatibility", {})
        features["treatment_compatibility"] = 1.0 if compat.get("compatible", False) else 0.0
    else:
        re_data = policy_data.get("rule_engine", {})
        compat = re_data.get("treatment_compatibility", {})
        features["treatment_compatibility"] = 1.0 if compat.get("compatible", False) else 0.3

    # 5. Documentation Quality (0-1)
    doc_quality = evidence_data.get("documentation_quality", "Medium")
    quality_map = {"High": 1.0, "Medium": 0.6, "Low": 0.2}
    features["documentation_quality"] = quality_map.get(doc_quality, 0.5)

    # 6. Risk Severity (inverse — high risk = lower score)
    risk_factors = clinical_data.get("risk_factors", [])
    risk_count = len(risk_factors) if isinstance(risk_factors, list) else 0
    features["risk_severity"] = max(0.0, 1.0 - (risk_count * 0.15))

    # 7. Completeness
    missing = evidence_data.get("missing_documents", [])
    missing_count = len(missing) if isinstance(missing, list) else 0
    features["completeness"] = max(0.0, 1.0 - (missing_count * 0.2))

    # ── Weighted Sum (Logistic Scoring) ─────────────────────
    weighted_sum = MODEL_BIAS
    feature_contributions = {}
    for feat_name, feat_value in features.items():
        weight = FEATURE_WEIGHTS.get(feat_name, 0.0)
        contribution = feat_value * weight
        weighted_sum += contribution
        feature_contributions[feat_name] = round(contribution, 4)

    # Sigmoid-like transformation to [0, 1]
    raw_prob = 1.0 / (1.0 + math.exp(-5.0 * (weighted_sum - 0.5)))
    approval_probability = round(max(0.01, min(0.99, raw_prob)), 4)

    # ── Confidence Interval ─────────────────────────────────
    # Wider interval when features are uncertain
    uncertainty = sum(1 for v in features.values() if 0.3 < v < 0.7) * 0.03
    margin = 0.08 + uncertainty
    ci_lower = round(max(0.0, approval_probability - margin), 4)
    ci_upper = round(min(1.0, approval_probability + margin), 4)

    # ── Risk Category ───────────────────────────────────────
    if approval_probability >= 0.80:
        risk_category = "Low Risk"
    elif approval_probability >= 0.55:
        risk_category = "Medium Risk"
    else:
        risk_category = "High Risk"

    # ── Feature Importance (normalized contributions) ───────
    total_contrib = sum(abs(v) for v in feature_contributions.values()) or 1.0
    feature_importance = {
        k: round(abs(v) / total_contrib, 4) for k, v in feature_contributions.items()
    }

    # ── Explanation ─────────────────────────────────────────
    explanation_parts = []
    sorted_features = sorted(feature_contributions.items(), key=lambda x: abs(x[1]), reverse=True)

    for feat_name, contrib in sorted_features[:3]:
        feat_val = features[feat_name]
        if feat_val >= 0.7:
            explanation_parts.append(f"{feat_name.replace('_', ' ').title()}: Strong positive signal ({feat_val:.0%})")
        elif feat_val <= 0.3:
            explanation_parts.append(f"{feat_name.replace('_', ' ').title()}: Weak — negatively impacts approval ({feat_val:.0%})")
        else:
            explanation_parts.append(f"{feat_name.replace('_', ' ').title()}: Moderate ({feat_val:.0%})")

    if approval_probability >= 0.75:
        verdict = "High likelihood of approval based on strong clinical evidence and policy alignment."
    elif approval_probability >= 0.50:
        verdict = "Moderate likelihood of approval. Some areas may need strengthening."
    else:
        verdict = "Low likelihood of approval. Significant gaps in evidence or policy compliance detected."

    explanation = f"{verdict} Key factors: {'; '.join(explanation_parts)}."

    # ── Violations / concerns ───────────────────────────────
    violations = policy_data.get("violations", [])
    missing_docs = evidence_data.get("missing_documents", [])

    return {
        "approval_probability": approval_probability,
        "confidence_interval": [ci_lower, ci_upper],
        "feature_importance": feature_importance,
        "feature_values": {k: round(v, 4) for k, v in features.items()},
        "risk_category": risk_category,
        "explanation": explanation,
        "model_version": "1.0-weighted-logistic",
        "violations": violations,
        "missing_documents": missing_docs,
        "_prediction_time_ms": int((time.time() - start_time) * 1000),
    }
