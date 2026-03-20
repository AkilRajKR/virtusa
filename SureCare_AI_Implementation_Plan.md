# 🏥 SureCare AI — Prior Authorization System

## Implementation Plan & Architecture Document

**Version:** 1.0  
**Date:** March 18, 2026  
**Project:** SureCare AI — AI-Driven Prior Authorization System  
**Status:** Planning Phase  

---

## 1. Executive Summary

SureCare AI transforms manual prior authorization into an **automated intelligent pipeline** with real-time decision simulation. The system uses a **5-agent multi-agent architecture** powered by Google Gemini LLM to process clinical documents, validate evidence, check policy compliance, predict approval probability, and generate structured authorization requests.

The platform is designed to be **modular, scalable, and demo-ready** — suitable for hackathons, academic evaluation, and enterprise prototyping.

---

## 2. Current State Analysis

| Component | Current | Target |
|---|---|---|
| **Project Name** | AutoAuth AI | SureCare AI |
| **Frontend** | React 18 + Vite + Tailwind CSS + Framer Motion | Enhanced with dashboard, appeal, audit trail pages |
| **Backend** | FastAPI (Python) with 3 AI agents | FastAPI with 5 AI agents + support services |
| **AI Engine** | Google Gemini 2.5 Flash | Same, with FAISS vector store + rule engine |
| **Database** | Supabase (PostgreSQL + Auth) | Self-contained SQLite + local JWT auth |
| **Agents** | Clinical Reader, Evidence Builder, Policy Intelligence | + Risk Prediction, Submission, Appeal |
| **API Endpoints** | `/api/analyze` only | `/upload`, `/analyze`, `/predict`, `/submit`, `/appeal` |
| **Features Missing** | — | FHIR simulation, audit trail, explainable AI, vector search |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SURECARE AI PLATFORM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │   Frontend    │    │              Backend (FastAPI)            │   │
│  │  React + Vite │◄──►│                                          │   │
│  │              │    │  ┌─────────┐  ┌─────────┐  ┌──────────┐  │   │
│  │  • Dashboard  │    │  │Clinical │  │Evidence │  │ Policy   │  │   │
│  │  • Upload     │    │  │Reader   │──►│Builder  │──►│Intel.    │  │   │
│  │  • Results    │    │  │Agent    │  │Agent    │  │Agent     │  │   │
│  │  • History    │    │  └─────────┘  └─────────┘  └──────────┘  │   │
│  │  • Appeal     │    │       │                          │        │   │
│  │  • Audit Log  │    │       ▼                          ▼        │   │
│  └──────────────┘    │  ┌─────────┐              ┌──────────┐    │   │
│                      │  │Risk     │              │Submission│    │   │
│                      │  │Predict  │              │Agent     │    │   │
│                      │  │Agent    │              └──────────┘    │   │
│                      │  └─────────┘                     │        │   │
│                      │       │          ┌───────────┐   │        │   │
│                      │       └─────────►│Appeal     │◄──┘        │   │
│                      │                  │Agent      │            │   │
│                      │                  └───────────┘            │   │
│                      └──────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  SQLite DB   │  │ FAISS Vector │  │  Mock FHIR R4 API        │  │
│  │  (Auth/Audit)│  │ Store        │  │  (Payer Simulation)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Agent Pipeline Flow

```
PDF Upload
    │
    ▼
┌─────────────────────┐
│ 1. Clinical Reader  │  Extract structured medical entities
│    Agent             │  (NLP + Gemini)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Evidence Builder │  Validate evidence against claims
│    Agent             │  (Cross-reference raw text)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Policy Intel.    │  Match against payer policy rules
│    Agent             │  (Rule Engine + Gemini)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. Risk Prediction  │  Predict approval probability
│    Agent             │  (ML scoring + explainability)
└────────┬────────────┘
         │
         ▼
    ┌────┴────┐
    │Decision │
    └────┬────┘
         │
    ┌────┴────────────┐
    │                  │
    ▼                  ▼
┌──────────┐   ┌────────────┐
│APPROVED  │   │ DENIED     │
│          │   │            │
│Submission│   │Appeal Agent│
│Agent     │   │generates   │
│generates │   │justification│
│FHIR      │   └────────────┘
│bundle    │
└──────────┘
```

---

## 4. Multi-Agent Architecture (5 Agents)

### Agent 1: Clinical Reader Agent
- **Purpose:** Extract structured medical data from unstructured clinical notes
- **Input:** Raw text from uploaded PDF
- **Output:** Structured JSON with patient demographics, diagnosis, treatment, ICD/CPT codes, risk factors
- **Technology:** Google Gemini LLM with JSON-structured prompts + regex fallback

### Agent 2: Evidence Builder Agent
- **Purpose:** Validate clinical claims against documentary evidence
- **Input:** Clinical data + raw medical text
- **Output:** Evidence validation scores, supported/unsupported flags, citations, missing document list
- **Technology:** Google Gemini LLM for semantic matching

### Agent 3: Policy Intelligence Agent
- **Purpose:** Evaluate compliance against insurance payer rules
- **Input:** Clinical data + evidence validation + policy rules
- **Output:** Policy match status, violations list, coverage determination, medical necessity rationale
- **Technology:** Deterministic rule engine + Gemini LLM + FAISS policy retrieval

### Agent 4: Risk Prediction Agent
- **Purpose:** Predict approval probability with explainability
- **Input:** Evidence score, policy match, risk factors, code validity
- **Output:** Approval probability (0-100%), confidence interval, feature importance breakdown
- **Technology:** Weighted scoring model with feature attribution

### Agent 5: Submission / Appeal Agent
- **Purpose (Approved):** Generate structured FHIR R4 prior authorization request bundle
- **Purpose (Denied):** Generate clinical appeal letter with counter-arguments and supporting evidence
- **Input:** Full pipeline results + decision status
- **Output:** FHIR JSON bundle (approved) or Appeal letter with justifications (denied)
- **Technology:** Gemini LLM + FHIR R4 templates

---

## 5. REST API Specification

### Core Endpoints

| Endpoint | Method | Description | Request | Response |
|---|---|---|---|---|
| `/api/upload` | POST | Upload clinical PDF | `multipart/form-data` (file) | `{document_id, filename, text_preview, page_count}` |
| `/api/analyze` | POST | Run full 5-agent pipeline | `{document_id}` or `multipart/form-data` | Full analysis with all agent outputs |
| `/api/predict` | POST | Risk prediction on analysis | `{analysis_data}` | `{approval_probability, confidence, features}` |
| `/api/submit` | POST | Generate FHIR auth request | `{analysis_id}` | FHIR R4 Bundle JSON |
| `/api/appeal` | POST | Generate denial appeal | `{analysis_id, denial_reasons}` | Appeal letter + justifications |

### Support Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/history` | GET | Authorization history list |
| `/api/audit` | GET | Audit trail logs (filterable) |
| `/api/auth/login` | POST | JWT authentication |
| `/api/auth/register` | POST | User registration |
| `/api/fhir/ClaimResponse` | POST | Mock payer FHIR response |
| `/health` | GET | Service health check |

---

## 6. AI & Data Integration

### 6.1 LLM Integration (Google Gemini 2.5 Flash)
- Used by 4 out of 5 agents for NLP reasoning
- Dynamic JSON schema prompts ensure consistent structured output
- 1M+ token context window handles large medical documents

### 6.2 FAISS Vector Store
- Stores embedded policy documents and clinical guidelines
- Used by Policy Intelligence Agent for context-aware rule matching
- Sentence-transformer embeddings (`all-MiniLM-L6-v2`)

### 6.3 Medical Rule Engine
- Deterministic ICD-10 ↔ CPT code validation pairs
- Treatment-diagnosis compatibility matrix
- Payer type coverage rules (Medicare, Medicaid, Commercial)
- Pre-authorization thresholds per procedure category

### 6.4 Mock FHIR R4 Simulation
- Simulates payer `ClaimResponse` with disposition codes
- Generates mock `Patient`, `Claim`, `CoverageEligibilityResponse` resources
- Configurable approval latency and denial rate

---

## 7. Frontend Pages & Features

| Page | Route | Description |
|---|---|---|
| **Login** | `/login` | JWT-based authentication (demo credentials) |
| **Dashboard** | `/dashboard` | Status cards, approval rate chart, recent activity |
| **Upload** | `/upload` | PDF drag-drop with 5-agent pipeline animation |
| **Results** | `/result` | Tabbed view: Clinical, Evidence, Policy, Risk, Submission |
| **History** | `/history` | Past authorization records with status |
| **Appeal** | `/appeal/:id` | Appeal generation for denied cases |
| **Audit Trail** | `/audit` | Timestamped agent activity log |

### Key UI Features
- 🎨 Glassmorphism dark theme with neon accent animations
- 📊 Approval probability gauge with confidence meter
- 🔍 Explainable AI feature importance chart
- 📋 FHIR JSON preview with syntax highlighting
- 📝 Appeal letter generator with one-click submission
- 🕒 Real-time agent pipeline progress visualization (5 agents)
- 📈 Dashboard analytics with Recharts

---

## 8. Output Format

### Structured JSON Response (from `/api/analyze`)

```json
{
  "authorization_id": "AUTH-2026-00042",
  "approval_status": "APPROVED | DENIED",
  "confidence_score": 87,
  "approval_probability": 0.87,
  "timestamp": "2026-03-18T22:05:27+05:30",
  "pipeline_summary": "Document processed through 5 AI agent nodes.",
  "details": {
    "clinical_data": {
      "patient_name": "John Doe",
      "patient_id": "MRN-12345",
      "diagnosis": "Type 2 Diabetes Mellitus",
      "treatment": "Insulin Pump Therapy",
      "icd_codes": ["E11.65"],
      "cpt_codes": ["95249"],
      "risk_factors": ["HbA1c > 9.0", "Prior hospitalization"]
    },
    "evidence_data": {
      "diagnosis_supported": true,
      "treatment_supported": true,
      "evidence_score": 82,
      "citations": ["HbA1c of 9.4% recorded on 2026-01-15..."]
    },
    "policy_data": {
      "policy_match": true,
      "coverage_status": "Covered",
      "violations": [],
      "medical_necessity_rationale": "Treatment meets medical necessity..."
    },
    "risk_prediction": {
      "approval_probability": 0.87,
      "confidence_interval": [0.79, 0.95],
      "feature_importance": {
        "evidence_score": 0.35,
        "policy_match": 0.30,
        "code_validity": 0.20,
        "risk_severity": 0.15
      },
      "risk_category": "Low Risk"
    },
    "submission": {
      "fhir_bundle_type": "Prior Authorization Request",
      "resource_count": 4,
      "status": "Ready for submission"
    }
  },
  "audit_trail": [
    {"agent": "Clinical Reader", "timestamp": "...", "status": "completed"},
    {"agent": "Evidence Builder", "timestamp": "...", "status": "completed"},
    {"agent": "Policy Intelligence", "timestamp": "...", "status": "completed"},
    {"agent": "Risk Prediction", "timestamp": "...", "status": "completed"},
    {"agent": "Submission Agent", "timestamp": "...", "status": "completed"}
  ]
}
```

---

## 9. Technology Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS 3.4 + Glassmorphism |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **State Management** | Zustand |
| **Backend Framework** | FastAPI (Python) |
| **AI/LLM** | Google Gemini 2.5 Flash |
| **Vector Database** | FAISS (faiss-cpu) |
| **Embeddings** | Sentence Transformers (all-MiniLM-L6-v2) |
| **Database** | SQLite (SQLAlchemy ORM) |
| **Authentication** | JWT (python-jose + bcrypt) |
| **PDF Processing** | pypdf |
| **FHIR Simulation** | Custom mock API (FastAPI routes) |

---

## 10. File Structure

```
virtusa/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment configuration
│   ├── database.py                # SQLite + SQLAlchemy setup
│   ├── models.py                  # Pydantic schemas
│   ├── routes.py                  # All REST API routes
│   ├── clinical_reader_agent.py   # Agent 1: NLP extraction
│   ├── evidence_builder_agent.py  # Agent 2: Evidence validation
│   ├── policy_intelligence_agent.py # Agent 3: Policy checking
│   ├── risk_prediction_agent.py   # Agent 4: ML prediction
│   ├── submission_agent.py        # Agent 5a: FHIR bundle
│   ├── appeal_agent.py            # Agent 5b: Appeal generation
│   ├── medical_rules.py           # Deterministic rule engine
│   ├── vector_store.py            # FAISS vector database
│   ├── fhir_simulator.py          # Mock FHIR R4 API
│   ├── audit_trail.py             # Audit logging system
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Environment template
├── src/
│   ├── App.jsx                    # Root router
│   ├── main.jsx                   # React entry
│   ├── index.css                  # Global styles
│   ├── context/
│   │   └── AuthContext.jsx        # JWT auth context
│   ├── services/
│   │   ├── api.js                 # Axios instance
│   │   └── surecare.service.js    # API service layer
│   ├── pages/
│   │   ├── LoginPage.jsx          # JWT login
│   │   ├── DashboardPage.jsx      # Overview dashboard
│   │   ├── DocumentUploadPage.jsx # PDF upload + 5-agent viz
│   │   ├── ResultDashboard.jsx    # Tabbed results (5 tabs)
│   │   ├── HistoryPage.jsx        # Authorization history
│   │   ├── AppealPage.jsx         # Appeal workflow
│   │   └── AuditTrailPage.jsx     # Agent activity logs
│   └── components/
│       ├── Navbar.jsx             # Navigation bar
│       └── ui/                    # Reusable UI components
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 11. Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@surecare.ai` | `admin123` |
| **Doctor** | `doctor@surecare.ai` | `demo123` |

---

## 12. Setup Instructions

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Server starts at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Frontend
```bash
npm install
npm run dev
# App starts at http://localhost:5173
```

---

*Document generated by SureCare AI Planning System — March 2026*


# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend (separate terminal)
npm run dev

