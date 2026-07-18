# Source Compliance Policy

Цель: зафиксировать практические правила подключения источников данных для
Domarion Analytics. Это инженерно-продуктовая policy, а не юридическое
заключение. Пункты `legal review` в плане остаются открытыми до проверки
юристом/консультантом по конкретному источнику и договору.

## Hard Rules

1. Источник нельзя включать в production ingestion, если в Source Registry нет
   owner, legal status, allowed use, refresh cadence, ingestion method,
   retention policy, notes по Terms/robots и evidence ссылок, если они есть.
2. `legal_status=approved` нужен до любого non-dry-run scheduled import,
   partner API sync, paid data import или developer feed import.
3. `review_required` разрешен только для dry-run, ручной оценки, smoke checks и
   sample fixtures без публикации пользователям.
4. `blocked` запрещает ingestion, export, report usage и SEO usage.
5. User-submitted URL используется только для one-off private analysis по
   инициативе пользователя, без bulk indexing, scheduled crawling, anti-bot
   bypass, captcha/login/paywall обхода.
6. Фото, контактные данные продавцов/владельцев, private notes, полные тексты
   описаний объявлений и raw HTML порталов нельзя копировать, хранить,
   показывать в UI/отчетах или экспортировать без отдельного правового
   основания.
7. Source URLs from user-submitted flow are private references. Они не
   публикуются, не индексируются, не уходят в SEO, public reports или public
   exports.
8. Любой commercial/sponsored/promoted блок должен быть явно маркирован и не
   должен влиять на scoring, AI verdict, fair price или risk labels.

## Source Approval Matrix

| Source class | Examples | Default legal status | Allowed before approval | Approval requirements |
| --- | --- | --- | --- | --- |
| Partner CSV/API | agency export, CRM export, developer partner feed | `review_required` | dry-run import, schema validation, QA logs | contract/consent, allowed use, removal path, retention, no prohibited personal data |
| User-submitted private reference | Otodom/OLX URL pasted by user | `approved` for private one-off flow only | one-off fetch/parse minimal fields, user confirmation | no bulk crawl, no photos/contacts/full description/raw HTML retention |
| Public portal listing pages | Otodom, OLX, Morizon, Gratka | `review_required` or `blocked` for crawling | user-submitted one-off only if policy allows private analysis | legal review of ToS/database rights/robots/rate limits before any automation beyond one-off |
| Official/open data | GUGiK/Geoportal, GUS/BDL, MPZP/Studium, GTFS, city geoportals, OSM | `review_required` unless explicitly documented | roadmap, dry-run import, attribution review | license/attribution/commercial use/retention review |
| Developer reputation sources | KRS/REGON, UOKiK, DFG, public directories, partner inspections | `review_required` | manual research notes, dry-run normalization | source-specific legal/data review, citation policy, dispute process |
| Paid data provider | licensed market data | `review_required` | contract review only | signed terms, product use rights, retention, export/report permissions |

## Terms / Robots / Rate-Limit Workflow

Every source must have an admin source registry entry with these fields reviewed:

- `terms_url`: link to terms/licence/contract or note that terms are contractual.
- `robots_txt_url`: link for web sources when applicable.
- `legal_status`: `unknown`, `review_required`, `approved` or `blocked`.
- `refresh_cadence`: manual/daily/weekly/monthly/contractual.
- `ingestion_method`: admin CSV upload, partner API, user submitted one-off,
  open-data import, developer feed import or manual.
- `allowed_use`: explicit list such as analytics, reports, price_history,
  map_layers, private_analysis, internal_qa.
- `raw_payload_retention_days` and `private_url_retention_days`.
- `retention_notes`: why the retention period is allowed.

Rate-limit baseline:

- Manual/admin CSV import: no network scraping; validate file size and rows.
- Partner API: use contract limits; if absent, default to conservative scheduled
  sync and retry backoff.
- Open-data downloads: prefer official bulk/download endpoints over page
  crawling, cache immutable files, record attribution.
- User-submitted one-off fetch: one URL per user action, timeout bounded,
  no retries that look like crawling, no anti-bot bypass.
- Portal crawling: disabled until legal review and source-specific policy
  approve it.

## Prohibited Data

Do not ingest or retain without separate legal basis:

- photos or photo copies;
- phone numbers, emails and names of private sellers/owners;
- private CRM notes;
- full copied portal descriptions;
- raw HTML from portal pages beyond short-lived parsing in memory;
- login-only, paywalled or captcha-protected content;
- personal data unrelated to property analysis.

Allowed minimum listing fields when approved or user-submitted:

- source listing id or private source reference;
- address/city/district/coordinates;
- price, area, rooms, floor, building floors, year, market type;
- publication/observation timestamps;
- normalized amenities/building attributes;
- hashes or telemetry needed for dedup/source quality, if allowed.

## User-Submitted URL Guardrails

The `/check` flow may fetch a single user-submitted Otodom/OLX URL only to
extract minimal parameters for that user draft.

Required UX and data behavior:

- user confirms they have the right to use the URL/data for private analysis;
- extracted fields are shown for confirmation/correction;
- warnings show when fetch fails or fields are partial;
- photos, contacts, full description and raw HTML are not retained;
- source URL remains private and owner-scoped;
- report metadata/content does not leak the full private URL;
- sanitized telemetry may keep domain/provider/status/extracted field names.

## Reports, AI and Exports

- Reports can cite official/open/developer sources only when source citations are
  allowed and useful for due diligence.
- User-submitted portal URL must not appear in public reports or SEO pages.
- Realtor/client exports may include partner listing source links only when
  source `allowed_use` permits sharing and the feature is explicitly enabled.
- AI prompts must not include prohibited photos, contacts, copied full
  descriptions or raw HTML.
- AI answers must include disclaimers for financial/legal/investment topics and
  must refuse guarantees.

## Operational Gates

Before enabling a source in production:

1. Create/update Source Registry entry.
2. Attach terms/robots/licence/contract references in notes.
3. Define allowed uses and retention.
4. Run dry-run import and data-quality review.
5. Verify prohibited fields are absent or stripped.
6. Verify deletion/removal process.
7. Set `legal_status=approved`.
8. Add monitoring for job failures, source freshness and high error rates.

Incident response:

- set source `legal_status=blocked` and `is_active=false`;
- stop scheduled jobs;
- prune raw payloads if required;
- create data deletion requests for affected private/source data;
- record action in admin audit log;
- update reports/exports if source-derived data must be withdrawn.
