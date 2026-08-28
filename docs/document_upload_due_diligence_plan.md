# Document Upload Due Diligence Plan

Статус: design/spec for a future first slice. Это не юридическое заключение и
не обязательство, что загруженный документ будет признан чистым. Реализация
должна оставаться gated до validation/legal review и ручного QA процесса для
paid reports.

## Goal

Дать покупателю способ приложить документы к private `/check` draft и получить
структурированные checklist signals:

- что найдено в документе;
- какие due-diligence пункты остаются неизвестными;
- где нужна проверка юриста, агента, банка, нотариуса или технического эксперта;
- какие противоречия требуют ручной проверки до zadatek/umowa rezerwacyjna.

Вывод должен быть decision-support screening, not legal advice. Domarion не
должен утверждать, что объект юридически или технически чист.

## First Slice

Первый production-safe slice должен быть metadata-first:

1. Пользователь выбирает существующий private draft.
2. Выбирает document type и подтверждает, что имеет право использовать документ
   для private analysis.
3. Загружает один файл или вводит document metadata без файла.
4. Backend извлекает только минимальные checklist signals.
5. Оригинальный файл не хранится по умолчанию.
6. Report/UI показывают checklist status, confidence, unknowns, conflicts and
   next expert checks.

Allowed first document classes:

- land and mortgage register/Księga Wieczysta extract or user-entered KW number;
- floor plan and usable-area document;
- wspólnota/spółdzielnia fee/debt/repair statement;
- energy performance certificate;
- developer prospectus/prospekt informacyjny;
- building permit/handover/payment schedule document for primary market.

Out of scope for first slice:

- broad contract review;
- legal conclusions;
- signature authenticity checks;
- storing scans/photos as report artifacts;
- seller identity verification beyond checklist prompts;
- extracting or storing names, PESEL, phone numbers, emails or bank account data.

## Data Model

Recommended owner-scoped records:

- `DocumentCheck`: draft id, owner id, document type, upload channel, status,
  source hash, created/updated timestamps, retention deadline and deleted flag.
- `DocumentSignal`: checklist code, status, confidence, short redacted evidence,
  page/section hint, severity and rationale.
- `DocumentUnknown`: checklist code, reason and recommended next action.
- `DocumentConflict`: conflicting field, observed values, severity and manual
  review note.

Do not store:

- raw file bytes by default;
- raw OCR text;
- full copied contract passages;
- names/PESEL/phone/email/bank accounts;
- seller contact details;
- public URLs for private files.

Optional original-file retention can exist only for explicit human Expert Review
consent, with short retention, private storage, virus scanning and deletion
workflow.

## Extraction Pipeline

1. Validate consent, owner access and draft ownership.
2. Validate file type and size.
3. Run malware scan if original bytes are persisted even temporarily outside
   process memory.
4. Extract text/OCR in a bounded worker.
5. Redact personal data before any AI or external model call.
6. Classify document type.
7. Map extracted facts to existing due-diligence checklist codes.
8. Create signals with conservative confidence.
9. Drop raw bytes/text unless explicit retention is enabled.
10. Attach summarized signals to buyer decision/report metadata.

Status values:

- `evidence_found`: document supports a checklist item.
- `needs_review`: document mentions the area but is insufficient for certainty.
- `conflict`: extracted fact conflicts with listing/user input/other document.
- `missing`: expected evidence is absent.
- `not_supported`: document cannot be interpreted by current extractor.

The extractor must prefer `needs_review` over positive certainty when confidence
is low.

## API Shape

Draft endpoints:

- `POST /api/v1/user-submitted-listings/{draft_id}/documents/analyze`
- `GET /api/v1/user-submitted-listings/{draft_id}/documents`
- `DELETE /api/v1/user-submitted-listings/{draft_id}/documents/{document_check_id}`

Analyze request:

- `document_type`: optional enum, user-selected if known;
- `retain_original`: default `false`;
- `expert_review_consent`: default `false`;
- multipart file or metadata-only payload;
- explicit `confirm_private_document_analysis=true`.

Analyze response:

- document check id;
- normalized document type;
- checklist signals;
- unknowns;
- conflicts;
- confidence;
- retention deadline;
- disclaimer;
- `raw_document_retained=false` unless explicitly consented.

Admin endpoints should be read-only until the legal/QA process is defined.
Admin UI may see document-check metadata and redacted signals, never raw private
documents by default.

## UI Flow

On `/check` result and saved draft history:

- Add `Document check` action near Full Due Diligence.
- Show document type selector before upload.
- Show explicit private-analysis consent.
- State that originals are not stored by default.
- Show file size/type restrictions before upload.
- Present results as checklist updates: found, needs review, conflicts, missing.
- Keep the final CTA as `Ask legal/expert review before zadatek`, not
  `document verified`.

For paid Expert Review later:

- allow explicit original-file retention;
- show retention deadline;
- show analyst status;
- mark `Verified by Domarion analyst` only after human QA, never after automatic
  extraction.

## Security And Retention

Initial limits:

- PDF, PNG, JPG/JPEG and plain text only;
- 10 MB per file;
- 5 files per draft before manual review;
- no archives, Office macros or password-protected documents in first slice;
- owner-scoped access on every endpoint;
- audit event for upload/analyze/delete;
- derived signals retained with the draft retention policy;
- raw temporary files deleted immediately after extraction;
- original file retention disabled unless Expert Review consent is true.

If external OCR/AI is used, send only redacted text and document type context,
never full raw files or source URLs unless a separate data processing agreement
and privacy review permit it.

## Checklist Mapping

Secondary-market examples:

- KW owner/seller authority -> `kw_owner`;
- mortgage, claims, easements -> `kw_mortgage`;
- land/użytkowanie wieczyste -> `land_status`;
- wspólnota debt -> `community_debt`;
- repair fund/building repairs -> `building_repairs`;
- floor plan/usable area -> `area_match`;
- energy certificate -> `energy_certificate`.

Primary-market examples:

- developer/project identity -> `developer_identity`;
- permits and land title -> `permits`;
- escrow/payment schedule -> `escrow`;
- prospekt informacyjny -> `prospekt`;
- handover date and delay penalties -> `handover`;
- finish standard -> `finish_standard`;
- warranty obligations -> `warranty`.

## Acceptance Criteria

- No automatic output claims legal certainty or clean title.
- Raw document bytes/text are not retained by default.
- Stored evidence is redacted and short.
- Private document metadata is owner-scoped and absent from public reports,
  SEO pages, exports and shared realtor previews unless explicitly allowed.
- Buyer decision output can consume document signals as additional evidence,
  unknowns and conflicts.
- Tests cover consent required, unsupported file rejection, retention defaults,
  no PII/raw text leakage and checklist mapping.

