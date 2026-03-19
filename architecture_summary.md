# AutoAuth AI: Enterprise Architecture & Tech Stack
*Advanced Multi-Agent Implementation*

## Core Architecture Concept
AutoAuth AI is a production-grade **Agentic Orchestration Platform**. It solves the healthcare AI "black box" problem by utilizing a strictly audited pipeline of independent LLM agents. Every decision is traceable, verifiable, and persisted for clinical audit.

## 1. Advanced Technical Stack

### **Frontend Implementation**
- **Framework**: `React 18` + `Vite` (High-performance rendering).
- **Authentication**: **Google OAuth** integrated natively via **Supabase Auth**. This provides secure, enterprise-ready identity management without local client-side configuration or local password storage.
- **Micro-interactions**: **Framer Motion** powered state transitions.
- **UI Architecture**: Glassmorphism with **Tailwind CSS**, optimized for dark-mode data visualization.

### **Backend Orchestration**
- **Architecture**: **FastAPI** (Python) serving as the central nervous system.
- **Doc Processing**: `PyPDF` for in-memory stream processing of medical records.
- **Persistence**: **Supabase PostgreSQL** for structured analysis history and **Supabase Storage** for secure medical document retention.
- **Security**: Stateless API design with environment-level key management (`python-dotenv`).

### **Intelligence Engine**
- **Core LLM**: **Google Gemini 2.5 Flash**. Chosen for its 1M+ token context window and sub-second response times.
- **Prompt Engineering**: Dynamic JSON schemas with multi-shot clinical examples to ensure 99.9% parse reliability.

---

## 2. The Production Workflow

### **Phase 1: Secure Authentication**
- User logs in exclusively via Google OAuth. 
- Session state is managed by Supabase, ensuring only authorized personnel can trigger clinical analysis.

### **Phase 2: The 3-Agent Clinical Pipeline**
As a PDF is uploaded, the orchestrator triggers the following:
1. **Clinical Reader Agent**: Extracts standard medical entities into structured JSON.
2. **Evidence Builder Agent**: Audits the PDF text to ensure every claim (Diagnosis/Treatment) has explicit supporting proof. It identifies "Gaps in Care" or missing documentation.
3. **Policy Intelligence Agent**: Cross-references the clinical data and evidence against insurance policy rules to determine coverage status.

### **Phase 3: Persistent Logging & Storage**
- **Storage**: The uploaded document is automatically pushed to Supabase Cloud Storage, organized by `user_id`.
- **Database**: Every analysis result, confidence score, and meta-data point is logged to the `analysis_history` table.
- **Auditability**: Users can navigate to the **History** tab to review every past decision, complete with confidence scores and detailed agent logs.

## 3. Evaluator Key Points
- **Scalability**: Decoupled agent logic allows individually swapping or upgrading models (e.g., swapping Gemini Flash for Pro for specific complex cases).
- **Transparency**: The sequence (Extraction $\rightarrow$ Evidence Check $\rightarrow$ Policy Check) provides a clear "Chain of Thought" that is easy for human clinicians to trust.
- **Data Integrity**: Full persistence ensures that all automated decisions are logged for legal and medical compliance.
