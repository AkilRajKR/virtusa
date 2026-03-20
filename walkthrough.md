# SureCare AI — Hybrid Data Architecture Walkthrough

## Summary

Upgraded SureCare AI from SQLite to support **Supabase PostgreSQL + Storage** with a hybrid data architecture for handling structured, semi-structured, and unstructured medical data.

---

## Changes Made

### Final Enhancement: Identity Resolution & Notification Alerts
1. **Identity Resolution Layer:** Inserted into the orchestration pipeline before heavy evidence analysis. If a document lacks any clinical or patient identifiers, it is instantly given an `AUTO DENIAL`. If only the patient name is missing, it's flagged as `NEEDS_DOCTOR_INPUT`. If clinical fields are missing, it throws `INCOMPLETE`.
2. **Notification / Appeals Agent:** An LLM Agent utilizing Gemini dynamically generates highly contextual emails for any `DENIED`, `NEEDS_DOCTOR_INPUT`, or `INCOMPLETE` case.
3. **Contextual UI Alerts:** The patient and provider portals seamlessly render these generated notifications alongside workflow blockers.

## Role-Based Workflow & Data Ownership (Latest Update)

The system now supports **4 distinct user roles**, each with isolated data access and specific workflows. The backend automatically manages the case state and triggers the AI pipeline based on document verification logic.

### 1. New Roles & Dashboards
*   **🩺 Doctor / Provider:**
    *   Uploads initial case documents (`/api/upload`) to create an Authorization.
    *   **Assigned Cases Dashboard (`/doctor/cases`):** Reviews documents uploaded by patients.
    *   Verifies or Rejects individual documents (`/api/doctor/verify`).
*   **👤 Patient:**
    *   Can ONLY view cases where they are explicitly assigned (`patient_id`).
    *   **Patient Portal (`/patient`):** Views an easy-to-read clinical progress bar.
    *   Uploads missing or supplementary documents directly to INCOMPLETE cases (`/api/patient/upload`).
*   **🏛️ Insurance Reviewer:**
    *   Can ONLY view cases that are `FINALIZED` (fully processed by the AI).
    *   **Review Dashboard (`/insurance`):** Read-only view of AI probabilities and decisions. Can add manual, internal remarks (`/api/insurance/remarks`).
*   **⚙️ System Admin:**
    *   Global visibility. Can view the full System Users Directory and Audit Logs.

### 2. Document Verification Lifecycle
A new [Document](file:///e:/virtusa/gokul/virtusa/backend/database.py#64-86) table now tracks every single file attached to an authorization case, holding a `verified_status`:
1.  **`PENDING`:** The document was just uploaded (by Doctor or Patient).
2.  **`VERIFIED`:** The Doctor explicitly marked the document as valid.
3.  **`REJECTED`:** The Doctor rejected the file (requires a written reason).

### 3. Automatic Pipeline Triggering
The Orchestrator logic has been updated for zero-touch processing:
*   Every time a Doctor verifies a document, the system checks if **all** uploaded documents for that case are now `VERIFIED`.
*   If true, the backend **automatically triggers the 5-Agent Pipeline ([_run_pipeline](file:///e:/virtusa/gokul/virtusa/backend/main.py#127-295))**, merging all extracted text across the verified documents.
*   The case transitions to `FINALIZED`, at which point it becomes visible to Insurance reviewers.

### 4. Technical Implementation Highlights
*   **Zero Logic Changes to AI Agents:** The core AI Prompts and Pipeline tools were perfectly preserved. The extraction merely wraps the agents in the new State Machine.
*   **Database Refinements:** `authorizations` table now supports `patient_id` and `assigned_doctor_id` ownership flags.
*   **Protected React Routing:** The frontend [App.jsx](file:///e:/virtusa/gokul/virtusa/src/App.jsx) enforces path restrictions (e.g. patients cannot access `/dashboard` or `/upload`).

---

## Technical Overview (Previous Hybrid Data Architecture)
|------|--------|---------|
| [config.py](file:///e:/virtusa/gokul/virtusa/backend/config.py) | Modified | Added Supabase env vars, patient role, file type config |
| [database.py](file:///e:/virtusa/gokul/virtusa/backend/database.py) | Rewritten | 6 tables: users, authorizations, documents, agent_logs, audit_logs, learning_records |
| [supabase_config.py](file:///e:/virtusa/gokul/virtusa/backend/supabase_config.py) | Rewritten | Storage CRUD: upload, signed URLs, delete, list files |
| [ocr_service.py](file:///e:/virtusa/gokul/virtusa/backend/ocr_service.py) | **New** | PDF/image/DOCX text extraction + Gemini structuring |
| [document_service.py](file:///e:/virtusa/gokul/virtusa/backend/document_service.py) | **New** | Document lifecycle: Upload→OCR→Structure→Store |
| [models.py](file:///e:/virtusa/gokul/virtusa/backend/models.py) | Modified | Added 5 new Pydantic schemas for document management |
| [main.py](file:///e:/virtusa/gokul/virtusa/backend/main.py) | Rewritten | 5 new endpoints, patient role support, PostgreSQL-ready |
| [requirements.txt](file:///e:/virtusa/gokul/virtusa/backend/requirements.txt) | Modified | Added psycopg2-binary, pytesseract, Pillow, python-docx, httpx |
| [.env.example](file:///e:/virtusa/gokul/virtusa/backend/.env.example) | Modified | Supabase credentials template |

### Frontend — 2 Files Modified

| File | Action | Purpose |
|------|--------|---------|
| [surecare.service.js](file:///e:/virtusa/gokul/virtusa/src/services/surecare.service.js) | Modified | Added processDocument, reprocessAuth, getDocuments, verifyDocument |
| [DocumentUploadPage.jsx](file:///e:/virtusa/gokul/virtusa/src/pages/DocumentUploadPage.jsx) | Rewritten | Multi-format upload, OCR preview, structured data preview |

---

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload PDF/image/DOCX → Storage → OCR → Structure → DB |
| `/api/process` | POST | Re-run OCR + Gemini structuring on existing document |
| `/api/reprocess` | POST | Re-run full 5-agent pipeline from stored document data |
| `/api/documents/{auth_id}` | GET | Fetch all documents for an authorization |
| `/api/documents/verify` | POST | Mark a document as verified (doctor/admin) |

---

## Database Schema (6 Tables)

```
users         → id, email, name, role (patient/doctor/insurance/admin)
authorizations → id, auth_id, status, missing_fields (JSON), result_data (JSON)
documents     → id, auth_id, file_url, file_type, ocr_text, structured_data (JSON), verified
agent_logs    → id, auth_id, agent_name, output (JSON), status
audit_logs    → id, authorization_id, agent_name, action, endpoint
learning_records → id, authorization_id, predicted_status, actual_status
```

---

## Key Design Decisions

- **Dual database support**: Auto-detects SQLite (fallback) vs PostgreSQL (Supabase) from `DATABASE_URL`
- **Graceful degradation**: If Supabase Storage is not configured, files save locally to `uploads/`
- **OCR fallbacks**: If pytesseract isn't installed, returns a descriptive message instead of crashing
- **Gemini structuring**: Raw OCR text is converted to clinical JSON via Gemini LLM, with regex-based fallback
- **Document versioning**: Each upload creates a new record linked to an authorization, with timestamp tracking

---

## Verification Results

✅ **Import test passed** — all new modules load correctly:
```
1. config OK
2. database OK: ['users', 'authorizations', 'documents', 'agent_logs', 'audit_logs', 'learning_records']
3. ocr_service OK
4. document_service OK
5. models OK
ALL IMPORTS PASSED
```

---

## Next Steps for You

1. **Configure Supabase**: Add credentials to [backend/.env](file:///e:/virtusa/gokul/virtusa/backend/.env):
   ```
   DATABASE_URL=postgresql://postgres:PASSWORD@db.YOURPROJECT.supabase.co:5432/postgres
   SUPABASE_URL=https://YOURPROJECT.supabase.co
   SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

2. **Create Storage Bucket**: In Supabase dashboard → Storage → Create bucket `medical-documents`

3. **Install Tesseract** (for image OCR): Download from [tesseract-ocr](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH

4. **Restart backend**: `cd backend && python main.py`

5. **Test**: Visit `http://localhost:8000/docs` — you'll see all new endpoints
