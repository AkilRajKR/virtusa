"""
SureCare AI — FAISS Vector Store
Embeddings + similarity search for policy document retrieval.
Uses sentence-transformers for embedding generation and FAISS for indexing.
"""
import os
import json
import numpy as np
from typing import List, Dict, Any

from config import FAISS_INDEX_DIR

# ── Policy Knowledge Base ──────────────────────────────────
# Simulated policy documents for vector retrieval
POLICY_DOCUMENTS = [
    {
        "id": "POL-001",
        "title": "Insulin Pump Therapy Coverage Policy",
        "content": "Insulin pump therapy is covered for patients with Type 1 or Type 2 diabetes mellitus who have failed conventional insulin therapy. Requirements include: HbA1c > 7.0% on two consecutive tests, documented insulin regimen failure, endocrinologist evaluation, and completion of diabetes self-management education. Prior authorization required for all insulin pump prescriptions.",
        "payer": "commercial",
        "category": "endocrinology",
    },
    {
        "id": "POL-002",
        "title": "Total Knee Replacement Authorization",
        "content": "Total knee arthroplasty (CPT 27447) requires prior authorization. Medical necessity criteria include: documented osteoarthritis with radiographic evidence (Kellgren-Lawrence grade 3 or 4), failure of conservative treatment for minimum 3 months (physical therapy, NSAIDs, corticosteroid injections), significant functional impairment documented on validated scoring tool, and BMI documented.",
        "payer": "commercial",
        "category": "orthopedics",
    },
    {
        "id": "POL-003",
        "title": "Cardiac Catheterization Policy",
        "content": "Diagnostic cardiac catheterization (CPT 93458/93459) is covered when non-invasive testing suggests significant coronary artery disease. Requirements: abnormal stress test or imaging, documented symptoms of chest pain or dyspnea, cardiology consultation, and recent echocardiogram. Emergency catheterization exempt from prior authorization.",
        "payer": "medicare",
        "category": "cardiology",
    },
    {
        "id": "POL-004",
        "title": "Chemotherapy Prior Authorization",
        "content": "Chemotherapy regimens require prior authorization for all cancer types. Documentation must include: pathology report with tumor staging, molecular/genetic testing results where applicable, treatment protocol from NCCN guidelines compliance, oncologist treatment plan, baseline laboratory values including CBC, metabolic panel, and tumor markers.",
        "payer": "commercial",
        "category": "oncology",
    },
    {
        "id": "POL-005",
        "title": "Spinal Fusion Surgery Coverage",
        "content": "Spinal fusion (CPT 22612/22630) requires prior authorization. Medical necessity criteria: documented spinal instability or deformity, failure of conservative treatment for 6+ months, advanced imaging (MRI/CT) within 6 months, neurological evaluation, documented functional limitations, and psychological evaluation for chronic pain patients.",
        "payer": "commercial",
        "category": "orthopedics",
    },
    {
        "id": "POL-006",
        "title": "Mental Health Service Coverage",
        "content": "Outpatient psychotherapy (CPT 90834/90837) is covered for diagnosed mental health conditions. Initial authorization covers up to 20 sessions. Requirements: documented DSM-5 diagnosis, treatment plan with measurable goals, licensed provider credentials, and progress notes at session 10 for continued authorization.",
        "payer": "commercial",
        "category": "mental_health",
    },
    {
        "id": "POL-007",
        "title": "MRI Authorization Policy",
        "content": "MRI studies require prior authorization for the following body regions: spine, brain, and joints. Requirements: clinical indication documented, conservative treatment attempted where applicable, prior imaging reviewed, and ordering physician specialty appropriate. Emergency MRI exempt from prior authorization.",
        "payer": "medicaid",
        "category": "radiology",
    },
    {
        "id": "POL-008",
        "title": "Dialysis Treatment Coverage",
        "content": "Hemodialysis (CPT 90935/90937) is covered for patients with end-stage renal disease (ESRD). Requirements: documented GFR < 15 mL/min, nephrology evaluation, vascular access assessment, patient education regarding treatment options, and documented medical necessity for dialysis modality selected.",
        "payer": "medicare",
        "category": "nephrology",
    },
    {
        "id": "POL-009",
        "title": "Coronary Artery Bypass Surgery",
        "content": "CABG surgery (CPT 33533) requires prior authorization. Criteria: angiographic evidence of significant coronary artery disease (>70% stenosis), cardiac surgical consultation, assessment of surgical risk using STS risk calculator, documented failed medical management, recent cardiac imaging.",
        "payer": "commercial",
        "category": "cardiology",
    },
    {
        "id": "POL-010",
        "title": "Pulmonary Function Testing",
        "content": "Pulmonary function tests (CPT 94010/94060) are covered for evaluation of respiratory symptoms. Prior authorization not required for initial diagnostic testing. Repeat testing requires documentation of change in clinical status, new symptoms, or medication adjustment evaluation.",
        "payer": "commercial",
        "category": "pulmonology",
    },
    {
        "id": "POL-011",
        "title": "Mastectomy Coverage Policy",
        "content": "Mastectomy (CPT 19301/19303) is covered for documented breast malignancy. Requirements: pathology confirmation of malignancy, surgical oncology consultation, multi-disciplinary tumor board review for complex cases, genetic testing results if applicable, pre-operative imaging within 30 days.",
        "payer": "commercial",
        "category": "oncology",
    },
    {
        "id": "POL-012",
        "title": "Botox Injection for Migraine",
        "content": "OnabotulinumtoxinA injection (CPT 64615) for chronic migraine requires prior authorization. Criteria: 15+ headache days per month for 3+ months, failure of at least 2 preventive medications, documented headache diary, and neurologist evaluation. Maximum 155 units per treatment session, treatments every 12 weeks.",
        "payer": "commercial",
        "category": "neurology",
    },
]


class PolicyVectorStore:
    """
    FAISS-based vector store for policy document retrieval.
    Falls back to keyword search if FAISS/sentence-transformers unavailable.
    """

    def __init__(self):
        self.documents = POLICY_DOCUMENTS
        self.embeddings = None
        self.index = None
        self.model = None
        self._initialized = False
        self._try_init_faiss()

    def _try_init_faiss(self):
        """Try to initialize FAISS with sentence-transformer embeddings."""
        try:
            import faiss
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            texts = [f"{d['title']} {d['content']}" for d in self.documents]
            self.embeddings = self.model.encode(texts, normalize_embeddings=True)
            
            dim = self.embeddings.shape[1]
            self.index = faiss.IndexFlatIP(dim)  # Inner product for cosine similarity
            self.index.add(self.embeddings.astype(np.float32))
            self._initialized = True
            print("[VectorStore] FAISS initialized with", len(self.documents), "policy documents")
        except ImportError:
            print("[VectorStore] FAISS/sentence-transformers not available, using keyword fallback")
            self._initialized = False

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant policy documents."""
        if self._initialized and self.model and self.index:
            return self._faiss_search(query, top_k)
        return self._keyword_search(query, top_k)

    def _faiss_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """FAISS-based semantic search."""
        query_embedding = self.model.encode([query], normalize_embeddings=True).astype(np.float32)
        scores, indices = self.index.search(query_embedding, min(top_k, len(self.documents)))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0:
                doc = self.documents[idx].copy()
                doc["relevance_score"] = round(float(score) * 100, 1)
                results.append(doc)
        return results

    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """Fallback keyword-based search."""
        query_lower = query.lower()
        scored = []
        for doc in self.documents:
            text = f"{doc['title']} {doc['content']}".lower()
            words = query_lower.split()
            score = sum(1 for w in words if w in text)
            if score > 0:
                result = doc.copy()
                result["relevance_score"] = round(score / len(words) * 100, 1)
                scored.append(result)
        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored[:top_k]


# Global singleton
_store = None

def get_vector_store() -> PolicyVectorStore:
    global _store
    if _store is None:
        _store = PolicyVectorStore()
    return _store
