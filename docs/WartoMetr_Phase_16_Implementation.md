# WartoMetr Phase 16 Implementation

Date: 2026-09-23

## Scope

Phase 16 adds the first production-safe document-analysis slice for private
user-submitted apartment drafts.

This is not broad contract review, legal advice, OCR, original-file retention
or human expert review. The implementation is metadata/text-first and maps only
short, redacted document signals into due-diligence checklist context.

## Implemented

- Owner-scoped API endpoints:
  - `POST /api/v1/user-submitted-listings/drafts/{draft_id}/documents/analyze`
  - `GET /api/v1/user-submitted-listings/drafts/{draft_id}/documents`
  - `DELETE /api/v1/user-submitted-listings/drafts/{draft_id}/documents/{document_check_id}`
- A `user_submitted_document_checks` table with owner id, draft id, document
  metadata, source hash, normalized signals, unknowns, conflicts and retention
  deadline.
- In-memory and Postgres store support with soft-delete for document checks.
- Deterministic document screening for the first allowed classes:
  - KW/register extract;
  - floor plan / usable-area document;
  - wspolnota fee/debt/repair statement;
  - energy certificate;
  - developer prospectus;
  - permit/handover document;
  - agreement draft;
  - other document.
- Redaction of email, phone, PESEL-like identifiers and bank-account-like
  numbers before evidence is stored.
- A `/check` result panel where buyers can select document type, attach a file
  or paste document notes, confirm private-analysis rights and inspect signals,
  unknowns, conflicts and provenance.
- Browser smoke coverage for the mobile `/check` flow after sign-in recovery,
  including a floor-plan document check.

## Data Integrity

The first slice does not claim that a document is clean, legally sufficient or
technically verified. Signals use conservative statuses such as
`needs_review`, `conflict`, `not_supported` and `evidence_found`.

Every signal includes provenance:

- source document;
- page when available;
- checklist field.

Raw document bytes and full raw text are not retained by default. The automated
endpoint rejects original-file retention requests until a paid Expert Review
workflow, retention policy and manual QA process exist.

## Verified

- `pytest tests/test_user_submitted_listing_analysis.py -k "document_check or document_checks" -q`
- `pytest tests/test_api_contract.py -q`
- `npm run generate:openapi`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`
- `npm run build`
- `BROWSER_BASE_URL=http://127.0.0.1:3000 BROWSER_API_BASE_URL=http://127.0.0.1:8010 npm run browser:check-entry`

## Not Verified

- Production Postgres migration execution against staging data.
- OCR for image/PDF documents.
- Malware scanning.
- Human legal/expert review.
- Original document retention and deletion workflow.

## Remaining Risks

- PDF/image uploads are accepted as document files but produce
  `not_supported` when no machine-readable text or metadata note is supplied;
  OCR remains a later phase.
- Keyword-based extraction is intentionally conservative and should be treated
  as screening support only.
- The document signals are stored separately from the buyer-decision package;
  future work may consume them directly in report generation and saved-draft
  summaries.
