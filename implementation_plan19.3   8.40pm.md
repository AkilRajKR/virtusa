# SureCare AI — Hybrid Data Architecture Upgrade

Upgrade the backend from SQLite to **Supabase PostgreSQL** with Supabase Storage, enabling handling of structured, semi-structured (JSONB), and unstructured (files) healthcare data. Add OCR processing, document versioning, and enhanced API routes.

## User Review Required

> [!IMPORTANT]
> **Supabase Credentials Needed**: You must provide your Supabase project URL, anon key, and service role key. These will go in [backend/.env](file:///e:/virtusa/gokul/virtusa/backend/.env). Do you already have a Supabase project set up, or should I provide instructions for creating one?

> [!WARNING]
> **Breaking Change**: The database switches from SQLite to Supabase PostgreSQL. The local [surecare.db](file:///e:/virtusa/gokul/virtusa/backend/surecare.db) file will no longer be used. Existing data will not be migrated automatically.

> [!IMPORTANT]
> **OCR Engine**: The plan uses `pytesseract` (Tesseract OCR) for image-based document extraction. Tesseract must be installed on the system. Alternative: we could use a cloud-based OCR API instead. Which do you prefer?

---

## Proposed Changes

### 1. Configuration & Dependencies

#### [MODIFY] [config.py](file:///e:/virtusa/gokul/virtusa/backend/config.py)
- Add Supabase environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Add `SUPABASE_BUCKET` constant (`"medical-documents"`)
- Replace SQLite `DATABASE_URL` with PostgreSQL connection string from Supabase
- Add `ROLE_PATIENT = "patient"` to valid roles

#### [MODIFY] [.env.example](file:///e:/virtusa/gokul/virtusa/backend/.env.example)
- Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Update `DATABASE_URL` example to PostgreSQL format

#### [MODIFY] [requirements.txt](file:///e:/virtusa/gokul/virtusa/backend/requirements.txt)
- Add: `psycopg2-binary`, `pytesseract`, `Pillow`, `python-docx`, `httpx`
- Remove: SQLite-specific workarounds

---

### 2. Database Layer (SQLAlchemy → Supabase PostgreSQL)

#### [MODIFY] [database.py](file:///e:/virtusa/gokul/virtusa/backend/database.py)
- Switch engine from SQLite to PostgreSQL (remove `check_same_thread`)
- Update [User](file:///e:/virtusa/gokul/virtusa/backend/database.py#20-29) model: add `"patient"` to role options
- Add [Document](file:///e:/virtusa/gokul/virtusa/src/services/surecare.service.js#19-33) model:
  ```
  documents: id, auth_id, uploaded_by, uploader_role, file_url, file_type,
             ocr_text (TEXT), structured_data (JSON as TEXT), verified (BOOLEAN),
             original_filename, file_size_bytes, created_at
  ```
- Add `AgentLog` model:
  ```
  agent_logs: id, auth_id, agent_name, output (JSON as TEXT), status, timestamp
  ```
- Update [Authorization](file:///e:/virtusa/gokul/virtusa/backend/database.py#31-47) model: add `missing_fields` column (TEXT, stores JSON)
- Keep SQLAlchemy ORM approach — it works with PostgreSQL with minimal changes

> [!NOTE]
> We use `Text` columns storing JSON strings (serialized via `json.dumps/loads`) instead of native JSONB since SQLAlchemy's `JSON` type with PostgreSQL requires careful dialect handling. This keeps the code portable and consistent with the existing pattern in `result_data`, `pipeline_state`, etc.

---

### 3. Supabase Storage & Services

#### [MODIFY] [supabase_config.py](file:///e:/virtusa/gokul/virtusa/backend/supabase_config.py)
- Rewrite with `httpx` for async support
- Add functions:
  - [upload_file_to_storage(auth_id, filename, content, content_type)](file:///e:/virtusa/gokul/virtusa/backend/supabase_config.py#48-77) — upload to `medical-documents/{auth_id}/{filename}`
  - `get_file_url(auth_id, filename)` — get signed/public URL
  - `delete_file(auth_id, filename)` — remove file from storage
  - `list_auth_files(auth_id)` — list files for an authorization
- Keep direct REST API approach (no Supabase SDK — more stable)

#### [NEW] [ocr_service.py](file:///e:/virtusa/gokul/virtusa/backend/ocr_service.py)
- `extract_text_from_pdf(content: bytes) -> str` — uses pypdf (existing)
- `extract_text_from_image(content: bytes) -> str` — uses pytesseract + Pillow
- `extract_text_from_docx(content: bytes) -> str` — uses python-docx
- `extract_text(content: bytes, file_type: str) -> str` — routing function
- `structure_ocr_output(raw_text: str) -> dict` — uses Gemini to convert raw OCR text to structured JSON (patient info, diagnosis, codes, etc.)

#### [NEW] [document_service.py](file:///e:/virtusa/gokul/virtusa/backend/document_service.py)
- `process_document(auth_id, file_content, filename, file_type, uploaded_by, uploader_role, db)`:
  1. Upload raw file to Supabase Storage
  2. Run OCR extraction
  3. Structure the OCR output via Gemini
  4. Save [Document](file:///e:/virtusa/gokul/virtusa/src/services/surecare.service.js#19-33) record to DB with ocr_text + structured_data
  5. Return document record
- `get_documents_for_auth(auth_id, db)` — fetch all documents
- `verify_document(doc_id, db)` — mark document as verified

---

### 4. API Routes

#### [MODIFY] [main.py](file:///e:/virtusa/gokul/virtusa/backend/main.py)

**Enhanced upload endpoint:**
- `POST /api/upload` — Accept PDF, images (png/jpg/jpeg), DOCX
  - Store file in Supabase Storage
  - Save document metadata in DB
  - Return document record

**New endpoints:**
- `POST /api/process` — Run OCR + structuring on an uploaded document
  - Input: `{document_id}`
  - Performs OCR, saves text, generates structured data, saves to DB
  - Returns: `{document_id, ocr_text_preview, structured_data}`

- `POST /api/reprocess` — Re-run AI pipeline using stored structured data
  - Input: `{auth_id}`
  - Pulls latest verified structured data from documents
  - Runs the 5-agent pipeline
  - Returns: full analysis result

- `GET /api/documents/{auth_id}` — List all documents for an authorization
  - Returns: array of document records with file URLs, OCR previews, verification status

**Updated existing endpoints:**
- `/api/analyze` — Updated to work with PostgreSQL, stores document records
- All role checks updated to include `"patient"` role where appropriate

#### [MODIFY] [models.py](file:///e:/virtusa/gokul/virtusa/backend/models.py)
- Add: `DocumentResponse`, `ProcessRequest`, `ProcessResponse`, `ReprocessRequest`, `UploadResponseV2`
- Update: [UploadResponse](file:///e:/virtusa/gokul/virtusa/backend/models.py#26-32) to include `file_url`, `file_type`

---

### 5. Frontend Updates

#### [MODIFY] [surecare.service.js](file:///e:/virtusa/gokul/virtusa/src/services/surecare.service.js)
- Add: `processDocument(documentId)` — call `POST /api/process`
- Add: `reprocessAuth(authId)` — call `POST /api/reprocess`
- Add: `getDocuments(authId)` — call `GET /api/documents/{auth_id}`
- Update: [uploadDocument()](file:///e:/virtusa/gokul/virtusa/src/services/surecare.service.js#19-33) — support multi-format files

#### [MODIFY] [DocumentUploadPage.jsx](file:///e:/virtusa/gokul/virtusa/src/pages/DocumentUploadPage.jsx)
- Accept PDF, images, DOCX (update file type filter)
- Show OCR text preview after processing
- Show structured data preview (collapsible JSON viewer)
- Add "Re-upload" button for additional documents
- Show document history for the current authorization

---

## Verification Plan

### Automated Tests

No existing test files were found in the project. Verification will be done via manual API testing and browser testing.

**Backend startup test** (ensures no import errors with new modules):
```bash
cd e:\virtusa\gokul\virtusa\backend
python -c "from database import Base, engine, Document, AgentLog; from ocr_service import extract_text; from document_service import process_document; print('All imports OK')"
```

### Manual Verification

1. **Backend starts successfully**:
   - Run `cd backend && python main.py`
   - Verify server starts at `http://localhost:8000`
   - Visit `http://localhost:8000/docs` — confirm new endpoints appear

2. **Database tables created**:
   - Check Supabase dashboard — verify `users`, `authorizations`, `documents`, `agent_logs`, `audit_logs`, `learning_records` tables exist

3. **File upload test** (via Swagger at `/docs`):
   - Login → Upload a PDF → Check Supabase Storage bucket has the file
   - Upload an image → Verify accepted

4. **OCR + Process test**:
   - Upload a document → Call `POST /api/process` with the document_id
   - Verify OCR text and structured data are returned and saved to DB

5. **Document retrieval test**:
   - Call `GET /api/documents/{auth_id}` → Verify returns list of documents with file URLs

6. **Frontend verification**:
   - Run `npm run dev` → Navigate to Upload page
   - Upload a PDF → Verify OCR preview shows
   - Verify structured data preview renders
