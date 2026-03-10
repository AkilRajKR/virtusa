# AutoAuth AI: Architecture & Tech Stack Summary
*For Project Evaluators & Technical Reviewers*

## Core Architecture Concept
AutoAuth AI operates on an **Agentic Orchestration Model**, utilizing a specifically tailored pipeline to automate and verify prior authorization requests. Instead of relying on a single monolithic prompt, the system routes complex patient charts through specialized AI modules (agents), each with constrained scopes governing their extraction, auditing, and reasoning steps. This minimizes hallucination, guarantees evidence tracing, and allows independent verifiability against discrete insurance policies.

## 1. Technical Stack
The application is built cleanly using modern full-stack methodologies with no external managed databases required for the live demo.

### **Frontend Interface**
- **Framework**: `React`, scaffolded via `Vite` for optimized, instant HMR builds.
- **Styling UI**: `Tailwind CSS`, applying custom futuristic / glassmorphic UI components.
- **Animations**: `Framer Motion`. Used to mask backend API latency with stunning, sequential multi-agent simulation animations to engage the user during processing.
- **Routing**: `React Router v6` (Login → Document Upload → Result Dashboard).

### **Backend Server**
- **Framework**: pure `Python 3` utilizing `FastAPI`. 
- **Server**: `Uvicorn` (ASGI web server).
- **Core Processing**: `PyPDF` to dynamically ingest and strip raw text streams directly from uploaded multipage PDF files without saving persistent files to disk.
- **Environment**: Strict environment variables loaded via `python-dotenv`.
- **API Strategy**: Contains a single central orchestration endpoint (`POST /api/analyze`) that chains the logic together.

### **AI Intelligence Layer**
- **LLM**: Exclusively integrated with **Google Gemini 2.5 Flash** due to its expansive context window and incredible speed in processing dense medical data.
- **SDK**: Accessed via the official `google-generativeai` SDK.
- **Data Structuring**: Agents are strictly prompted to return serialized JSON, bypassing Markdown errors and enabling programmatic decision modeling.

---

## 2. The 3-Agent Workflow (How It Works)

### **Phase 1: Input & Orchestration (`analysis_agent.py`)**
1. The user logs in to the React app and uploads a patient PDF file.
2. The file is POSTed to the FastAPI orchestrator.
3. The orchestrator uses PyPDF to extract the raw text and initiates the sequential Agent chain.

### **Phase 2: Agent 1 - Clinical Reader (`clinical_reader_agent.py`)**
- **The Job**: Ingests raw OCR/text scraped from the PDF.
- **The Execution**: It is strictly prompted as a clinical data extractor. It identifies the Patient Name, Primary Diagnosis, intended Treatment pathways, and creates a dense summary of the doctor's qualitative notes into pristine, machine-readable JSON.

### **Phase 3: Agent 2 - Evidence Builder (`evidence_builder_agent.py`)**
- **The Job**: Receives *both* the raw document text and the structured output from Agent 1.
- **The Execution**: It acts as a hard-line auditor. It looks at the claims made in Phase 2 and verifies if actual *explicit evidence* exists in the raw text to back it up (e.g. "Do we actually have lab results or MRI scans to prove the claimed diagnosis?"). It dynamically builds an array flagging missing required documents.

### **Phase 4: Agent 3 - Policy Intelligence (`policy_intelligence_agent.py`)**
- **The Job**: Receives the structured clinical data (from Agent 1) and the auditor's evidence breakdown (from Agent 2). 
- **The Execution**: Final logic reasoning. It acts as the insurance rule engine, applying standard medical necessity guidelines to evaluate whether the verified evidence justifies the requested coverage.

### **Phase 5: Deterministic Decision Logic** 
After gathering the structured JSON reasoning from all 3 independent agents, the main FastAPI orchestrator applies final deterministic rules:
- If there are **policy violations** or **missing evidence documents**, it issues a `REJECTED` verdict.
- It calculates a final system **Confidence Score** depending on how severe the gap is (e.g., heavily penalizing missing evidence). 
- If all evidence and policies align, it passes an `APPROVED` status with high confidence (85%+).
- The entire JSON payload is returned to the React frontend, which unpacks the details neatly into the Result Dashboard.
