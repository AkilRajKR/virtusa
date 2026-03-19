"""
SureCare AI — Appeal Agent
Generates clinical appeal letters and counter-arguments for denied authorizations.
"""
import google.generativeai as genai
import json
import time
from typing import Dict, Any, List

from config import GEMINI_MODEL


def generate_appeal(
    clinical_data: Dict[str, Any],
    evidence_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    risk_prediction: Dict[str, Any],
    denial_reasons: List[str] = None,
    authorization_id: str = "",
) -> Dict[str, Any]:
    """
    Generate a comprehensive appeal for a denied prior authorization.
    """
    start_time = time.time()

    if not denial_reasons:
        denial_reasons = policy_data.get("violations", []) + evidence_data.get("missing_documents", [])
        if not denial_reasons:
            denial_reasons = ["Authorization was denied without specific reason provided."]

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = f"""You are a healthcare appeals specialist writing a formal appeal letter for a denied prior authorization.

The authorization was DENIED for the following reasons:
{json.dumps(denial_reasons, indent=2)}

Patient Clinical Data:
{json.dumps(clinical_data, indent=2)}

Evidence Available:
{json.dumps(evidence_data, indent=2)}

Policy Evaluation:
{json.dumps(policy_data, indent=2)}

Risk Assessment:
Approval probability was {risk_prediction.get('approval_probability', 0)*100:.1f}%

Write a formal, professional appeal that:
1. Addresses each denial reason directly
2. Provides counter-arguments with clinical justification
3. References medical literature and guidelines
4. Requests specific reconsideration

Output JSON format MUST be exactly:
{{
  "appeal_letter": "Full formal appeal letter text (multi-paragraph, professional tone)",
  "counter_arguments": ["Specific counter-argument for each denial reason"],
  "supporting_references": ["Medical literature, guidelines, or studies that support the case"],
  "recommended_actions": ["Specific actions the provider should take to strengthen the appeal"],
  "appeal_strength": "Strong/Moderate/Weak",
  "key_points": ["Bullet points summarizing the strongest arguments"]
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
        data["denial_reasons"] = denial_reasons
        data["authorization_id"] = authorization_id
        data["_generation_time_ms"] = int((time.time() - start_time) * 1000)
        return data

    except Exception as e:
        print(f"[AppealAgent] Error: {e}")
        # Fallback appeal generation
        counter_args = []
        for reason in denial_reasons:
            counter_args.append(
                f"Regarding '{reason}': The clinical documentation demonstrates medical necessity "
                f"for {clinical_data.get('treatment', 'the proposed treatment')} based on the "
                f"diagnosis of {clinical_data.get('diagnosis', 'the documented condition')}. "
                f"We respectfully request reconsideration."
            )

        return {
            "appeal_letter": _generate_fallback_letter(clinical_data, denial_reasons, counter_args),
            "counter_arguments": counter_args,
            "supporting_references": [
                "AMA Prior Authorization Guidelines 2024",
                "CMS National Coverage Determination",
                "Relevant specialty society clinical guidelines",
            ],
            "recommended_actions": [
                "Submit additional supporting documentation",
                "Request peer-to-peer review with medical director",
                "Obtain specialist letter of medical necessity",
            ],
            "appeal_strength": "Moderate",
            "key_points": [
                f"Treatment ({clinical_data.get('treatment', 'N/A')}) is clinically appropriate",
                f"Diagnosis ({clinical_data.get('diagnosis', 'N/A')}) is well-documented",
                "Request for level 2 appeal review",
            ],
            "denial_reasons": denial_reasons,
            "authorization_id": authorization_id,
            "_generation_time_ms": int((time.time() - start_time) * 1000),
        }


def _generate_fallback_letter(
    clinical_data: Dict[str, Any],
    denial_reasons: List[str],
    counter_args: List[str],
) -> str:
    """Generate a templated appeal letter when LLM is unavailable."""
    patient = clinical_data.get("patient_name", "the patient")
    provider = clinical_data.get("requesting_provider", "the requesting provider")
    diagnosis = clinical_data.get("diagnosis", "the documented condition")
    treatment = clinical_data.get("treatment", "the proposed treatment")

    reasons_text = "\n".join(f"  - {r}" for r in denial_reasons)
    counter_text = "\n".join(f"  {i+1}. {c}" for i, c in enumerate(counter_args))

    return f"""FORMAL APPEAL — Prior Authorization Denial

Dear Medical Review Board,

I am writing on behalf of {patient} to formally appeal the denial of prior authorization for {treatment}.

The authorization was denied for the following stated reasons:
{reasons_text}

We respectfully disagree with this determination and present the following counter-arguments:
{counter_text}

The patient has been diagnosed with {diagnosis}, which has been confirmed through clinical evaluation by {provider}. The proposed treatment represents the standard of care for this condition and is medically necessary.

We request that this case be re-evaluated in light of the supporting clinical evidence and that the denial be overturned.

Respectfully submitted,
{provider}
SureCare AI Prior Authorization System"""
