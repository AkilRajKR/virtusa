"""
SureCare AI — Policy Intelligence Agent
Evaluates prior authorization against payer rules using rule engine + FAISS vector search + LLM.
"""
import google.generativeai as genai
import json
import time
from typing import Dict, Any

from config import GEMINI_MODEL
from medical_rules import run_full_rule_engine
from vector_store import get_vector_store


def compare_against_policy(
    clinical_data: Dict[str, Any],
    evidence_data: Dict[str, Any],
    payer_type: str = "commercial",
) -> Dict[str, Any]:
    """
    Compare extracted clinical data and evidence against insurance policy rules.
    Combines: deterministic rule engine + FAISS policy retrieval + LLM reasoning.
    """
    start_time = time.time()

    # 1. Run deterministic rule engine
    icd_codes = clinical_data.get("icd_codes", [])
    cpt_codes = clinical_data.get("cpt_codes", [])
    treatment = clinical_data.get("treatment", "")
    rule_result = run_full_rule_engine(icd_codes, cpt_codes, treatment, payer_type)

    # 2. Retrieve relevant policies via vector search
    diagnosis = clinical_data.get("diagnosis", "")
    query = f"{diagnosis} {treatment} prior authorization"
    store = get_vector_store()
    relevant_policies = store.search(query, top_k=3)
    policy_context = "\n\n".join(
        [f"Policy: {p['title']}\n{p['content']}" for p in relevant_policies]
    )

    # 3. LLM-based policy reasoning
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are a strict insurance policy intelligence agent for a prior authorization system.
Evaluate this prior authorization request using the clinical data, evidence, rule engine results, and relevant policy documents.

Clinical Data:
{json.dumps(clinical_data, indent=2)}

Evidence Validation:
{json.dumps(evidence_data, indent=2)}

Rule Engine Results:
{json.dumps(rule_result, indent=2)}

Relevant Policy Documents:
{policy_context}

Based on ALL these inputs, determine the policy compliance.

Output JSON format MUST be exactly:
{{
  "policy_match": true or false,
  "violations": ["list of specific policy rules violated"],
  "coverage_status": "Covered" or "Not Covered" or "Partially Covered",
  "priority_level": "High" or "Medium" or "Low",
  "medical_necessity_rationale": "Detailed explanation of medical necessity determination",
  "matched_policies": ["names of policies that apply"],
  "required_actions": ["actions needed before approval"],
  "payer_recommendation": "Brief recommendation to the payer"
}}

Do not include any Markdown formatting in your output, just the raw JSON string."""

        response = model.generate_content(prompt)

        res_text = response.text.strip()
        if res_text.startswith("```json"):
            res_text = res_text[7:]
        if res_text.startswith("```"):
            res_text = res_text[3:]
        if res_text.endswith("```"):
            res_text = res_text[:-3]

        data = json.loads(res_text.strip())
        data["rule_engine"] = rule_result
        data["relevant_policies_used"] = [p["title"] for p in relevant_policies]
        data["_evaluation_time_ms"] = int((time.time() - start_time) * 1000)
        return data

    except Exception as e:
        print(f"[PolicyIntelligence] Error: {e}")
        return {
            "policy_match": rule_result.get("rule_engine_pass", False),
            "violations": ["Error during LLM policy evaluation — using rule engine only"],
            "coverage_status": "Not Covered" if not rule_result.get("rule_engine_pass") else "Covered",
            "priority_level": "High",
            "medical_necessity_rationale": "Evaluated via rule engine only (LLM unavailable).",
            "matched_policies": [],
            "required_actions": [],
            "payer_recommendation": "Manual review recommended.",
            "rule_engine": rule_result,
            "relevant_policies_used": [],
            "_evaluation_time_ms": int((time.time() - start_time) * 1000),
        }
