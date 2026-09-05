# API Surface

Дата сверки: 2026-08-27. Список ниже получен из `domarion.main.app.openapi()`
для текущего FastAPI приложения. Swagger UI на `/docs` остается источником
истины для параметров, request bodies и response schemas.

## Runtime Endpoints

| Method | Path | Назначение |
| --- | --- | --- |
| `GET` | `/health` | Process heartbeat. |
| `GET` | `/ready` | Production readiness/preflight report. |

## Public Product API

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/listings` |
| `GET` | `/api/v1/listings/hidden-gems` |
| `GET` | `/api/v1/listings/{listing_id}` |
| `GET` | `/api/v1/listings/{listing_id}/analysis` |
| `GET` | `/api/v1/listings/{listing_id}/future-impact` |
| `GET` | `/api/v1/listings/{listing_id}/growth-analysis` |
| `GET` | `/api/v1/listings/{listing_id}/risk-profile` |
| `GET` | `/api/v1/listings/{listing_id}/rental-estimate` |
| `GET` | `/api/v1/listings/{listing_id}/developer` |
| `POST` | `/api/v1/compare` |
| `GET` | `/api/v1/areas` |
| `GET` | `/api/v1/areas/compare` |
| `GET` | `/api/v1/areas/{area_id}/statistics` |
| `GET` | `/api/v1/map/features` |
| `GET` | `/api/v1/locations` |
| `GET` | `/api/v1/locations/districts` |
| `GET` | `/api/v1/locations/municipalities` |
| `GET` | `/api/v1/infrastructure/amenities` |
| `GET` | `/api/v1/infrastructure/industrial-zones` |
| `GET` | `/api/v1/infrastructure/kindergartens` |
| `GET` | `/api/v1/infrastructure/schools` |
| `GET` | `/api/v1/infrastructure/transport-routes` |
| `GET` | `/api/v1/infrastructure/transport-stops` |
| `GET` | `/api/v1/news` |
| `GET` | `/api/v1/news/{article_id}` |
| `GET` | `/api/v1/developers` |
| `GET` | `/api/v1/developers/{developer_id}` |
| `POST` | `/api/v1/mortgage/calculate` |
| `POST` | `/api/v1/realtor/client-shortlists/preview` |

## Account, Plans And User Workflows

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/me` |
| `PATCH` | `/api/v1/me/subscription` |
| `GET` | `/api/v1/plans` |
| `GET` | `/api/v1/favorites` |
| `POST` | `/api/v1/favorites` |
| `GET` | `/api/v1/favorites/{favorite_id}` |
| `PATCH` | `/api/v1/favorites/{favorite_id}` |
| `DELETE` | `/api/v1/favorites/{favorite_id}` |
| `GET` | `/api/v1/alerts` |
| `POST` | `/api/v1/alerts` |
| `GET` | `/api/v1/alerts/{alert_id}` |
| `PATCH` | `/api/v1/alerts/{alert_id}` |
| `DELETE` | `/api/v1/alerts/{alert_id}` |
| `GET` | `/api/v1/alerts/{alert_id}/preview` |
| `POST` | `/api/v1/alerts/{alert_id}/deliver` |
| `POST` | `/api/v1/alerts/{alert_id}/realtor-digest` |
| `GET` | `/api/v1/alert-delivery-jobs` |

## User-Submitted Listing Flow

| Method | Path |
| --- | --- |
| `POST` | `/api/v1/user-submitted-listings/reference-preview` |
| `POST` | `/api/v1/user-submitted-listings/import-from-url` |
| `POST` | `/api/v1/user-submitted-listings/analyze` |
| `POST` | `/api/v1/user-submitted-listings/report` |
| `GET` | `/api/v1/user-submitted-listings/drafts` |
| `GET` | `/api/v1/user-submitted-listings/drafts/{draft_id}` |
| `DELETE` | `/api/v1/user-submitted-listings/drafts/{draft_id}` |
| `POST` | `/api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate` |

Analysis and report responses expose buyer source evidence with the source
class, update date, observation count, geographic scope, time range, explicit
observed/calculated/model-estimate/unknown method, confidence, and notes when
those values are available. The frontend renders these fields through the
shared provenance disclosure instead of exposing internal source codes.

Listing analysis responses also expose `comparable_evidence` for the selected
fresh comparable sample. Each item carries its observed date, market type,
price, price/m2, size, rooms, optional floor/building year/condition, distance
from the subject, deterministic technical similarity score and factor codes.
The `Dlaczego taka cena?` UI localizes those factors and states that they are
reference points, not transaction valuations or guarantees.

## Reports, Payments And Exports

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/report-products` |
| `GET` | `/api/v1/report-orders` |
| `POST` | `/api/v1/report-orders` |
| `GET` | `/api/v1/report-orders/{order_id}` |
| `GET` | `/api/v1/report-orders/{order_id}/events` |
| `POST` | `/api/v1/report-orders/{order_id}/mock-pay` |
| `POST` | `/api/v1/report-orders/{order_id}/fulfill` |
| `POST` | `/api/v1/payment-webhooks/{provider}` |
| `GET` | `/api/v1/reports` |
| `POST` | `/api/v1/reports/object` |
| `POST` | `/api/v1/reports/object/generate` |
| `GET` | `/api/v1/reports/object/{listing_id}.html` |
| `GET` | `/api/v1/reports/object/{listing_id}.pdf` |
| `GET` | `/api/v1/reports/templates` |
| `GET` | `/api/v1/reports/export` |
| `GET` | `/api/v1/reports/{report_id}` |
| `GET` | `/api/v1/reports/{report_id}/content` |
| `POST` | `/api/v1/reports/{report_id}/email` |
| `GET` | `/api/v1/reports/{report_id}/pdf` |
| `GET` | `/api/v1/datasets/listings/export` |

`GET /api/v1/reports` includes a `decision_summary` snapshot when the
report was generated from a buyer decision. The snapshot contains only the
non-sensitive verdict, price-range, confidence and next-offer fields needed
for report-list cards; older reports and non-property reports may return
`null` fields.

## AI And Stored Insights

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/ai/data-contract` |
| `GET` | `/api/v1/ai/questions` |
| `POST` | `/api/v1/ai/listings/{listing_id}/answer` |
| `POST` | `/api/v1/ai/user-submitted-listing-drafts/{draft_id}/answer` |
| `POST` | `/api/v1/ai/compare/answer` |
| `POST` | `/api/v1/ai/areas/{area_id}/summary` |
| `POST` | `/api/v1/ai/news/{article_id}/summary` |
| `GET` | `/api/v1/ai-insights` |
| `GET` | `/api/v1/ai-insights/{insight_id}` |

## B2B, API-Lite And Enterprise

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/api-lite/listings` |
| `GET` | `/api/v1/api-lite/listings/{listing_id}` |
| `GET` | `/api/v1/api-lite/areas/compare` |
| `GET` | `/api/v1/api-lite/usage` |
| `GET` | `/api/v1/market/dashboard` |
| `GET` | `/api/v1/market/intelligence-report` |
| `POST` | `/api/v1/scoring/evaluate` |
| `GET` | `/api/v1/enterprise/custom-dashboards` |
| `POST` | `/api/v1/enterprise/custom-dashboards` |
| `GET` | `/api/v1/enterprise/custom-dashboards/{dashboard_id}` |
| `PATCH` | `/api/v1/enterprise/custom-dashboards/{dashboard_id}` |
| `DELETE` | `/api/v1/enterprise/custom-dashboards/{dashboard_id}` |
| `POST` | `/api/v1/enterprise/custom-dashboards/{dashboard_id}/preview` |

## Agency And CRM-Light

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/agencies` |
| `POST` | `/api/v1/agencies` |
| `GET` | `/api/v1/agencies/{agency_id}` |
| `PATCH` | `/api/v1/agencies/{agency_id}` |
| `POST` | `/api/v1/agencies/{agency_id}/members` |
| `PATCH` | `/api/v1/agencies/{agency_id}/members/{membership_id}` |
| `DELETE` | `/api/v1/agencies/{agency_id}/members/{membership_id}` |
| `GET` | `/api/v1/agencies/{agency_id}/crm/clients` |
| `POST` | `/api/v1/agencies/{agency_id}/crm/clients` |
| `GET` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}` |
| `PATCH` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}` |
| `GET` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes` |
| `POST` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes` |
| `PATCH` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes/{note_id}` |
| `DELETE` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/notes/{note_id}` |
| `GET` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists` |
| `POST` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists` |
| `GET` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}` |
| `PATCH` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}` |
| `DELETE` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}` |
| `POST` | `/api/v1/agencies/{agency_id}/crm/clients/{client_id}/shortlists/{shortlist_id}/share-preview` |
| `GET` | `/api/v1/crm/shared-shortlists/{share_token}` |

## Partner Referrals

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/partner-referrals` |
| `POST` | `/api/v1/partner-referrals` |
| `GET` | `/api/v1/partner-referrals/{referral_id}` |
| `GET` | `/api/v1/admin/partner-referrals` |
| `GET` | `/api/v1/admin/partner-referrals/lead-scores` |
| `PATCH` | `/api/v1/admin/partner-referrals/{referral_id}` |
| `GET` | `/api/v1/admin/partner-referrals/{referral_id}/lead-score` |
| `GET` | `/api/v1/admin/paid-beta/tracking` |
| `PATCH` | `/api/v1/admin/paid-beta/tracking/{referral_id}` |

## Internal Admin API

Admin routes require the authenticated account role to be `admin`. Legacy
identity headers are accepted only by explicit local/development/test demo
fixtures and are never a production authentication mechanism.

| Method | Path |
| --- | --- |
| `GET` | `/api/v1/admin/ingestion/jobs` |
| `POST` | `/api/v1/admin/ingestion/jobs` |
| `GET` | `/api/v1/admin/ingestion/jobs/{job_id}` |
| `GET` | `/api/v1/admin/ingestion/source-health` |
| `GET` | `/api/v1/admin/ingestion/source-checks` |
| `POST` | `/api/v1/admin/ingestion/source-checks` |
| `GET` | `/api/v1/admin/ingestion/source-errors` |
| `POST` | `/api/v1/admin/ingestion/source-errors` |
| `PATCH` | `/api/v1/admin/ingestion/source-errors/{error_id}` |
| `POST` | `/api/v1/admin/ingestion/source-errors/{error_id}/retry` |
| `GET` | `/api/v1/admin/ingestion/sources` |
| `POST` | `/api/v1/admin/ingestion/sources` |
| `PATCH` | `/api/v1/admin/ingestion/sources/{source_id}` |
| `POST` | `/api/v1/admin/ingestion/sources/prune-retained-raw-payloads` |
| `GET` | `/api/v1/admin/ingestion/open-data-roadmap` |
| `GET` | `/api/v1/admin/data-quality/logs` |
| `POST` | `/api/v1/admin/data-quality/logs` |
| `GET` | `/api/v1/admin/raw-listings` |
| `GET` | `/api/v1/admin/raw-listings/{raw_listing_id}` |
| `POST` | `/api/v1/admin/listings/import-csv` |
| `PATCH` | `/api/v1/admin/listings/{listing_id}/normalized` |
| `GET` | `/api/v1/admin/deduplication/matches` |
| `PATCH` | `/api/v1/admin/deduplication/matches/{match_id}` |
| `POST` | `/api/v1/admin/infrastructure/enrich` |
| `POST` | `/api/v1/admin/infrastructure/import` |
| `GET` | `/api/v1/admin/planned-investments` |
| `POST` | `/api/v1/admin/planned-investments` |
| `POST` | `/api/v1/admin/planned-investments/import` |
| `GET` | `/api/v1/admin/planned-investments/{investment_id}` |
| `PATCH` | `/api/v1/admin/planned-investments/{investment_id}` |
| `DELETE` | `/api/v1/admin/planned-investments/{investment_id}` |
| `GET` | `/api/v1/admin/user-submitted-listing-drafts` |
| `POST` | `/api/v1/admin/user-submitted-listing-drafts/prune-expired` |
| `POST` | `/api/v1/admin/developers/import` |
| `PUT` | `/api/v1/admin/developers/profiles/{developer_id}` |
| `DELETE` | `/api/v1/admin/developers/profiles/{developer_id}` |
| `PUT` | `/api/v1/admin/developers/projects/{project_id}` |
| `DELETE` | `/api/v1/admin/developers/projects/{project_id}` |
| `PUT` | `/api/v1/admin/developers/aliases/{alias_id}` |
| `DELETE` | `/api/v1/admin/developers/aliases/{alias_id}` |
| `PUT` | `/api/v1/admin/developers/signals/{signal_id}` |
| `PATCH` | `/api/v1/admin/developers/signals/{signal_id}/moderation` |
| `DELETE` | `/api/v1/admin/developers/signals/{signal_id}` |
| `POST` | `/api/v1/admin/news/articles` |
| `PATCH` | `/api/v1/admin/news/articles/{article_id}` |
| `GET` | `/api/v1/admin/audit-logs` |
| `GET` | `/api/v1/admin/data-deletion-requests` |
| `POST` | `/api/v1/admin/data-deletion-requests` |
| `POST` | `/api/v1/admin/data-deletion-requests/{request_id}/process` |
| `GET` | `/api/v1/admin/scoring/backtest` |
| `GET` | `/api/v1/admin/scoring/backtest-report` |
| `POST` | `/api/v1/admin/area-market-snapshots` |
| `POST` | `/api/v1/admin/price-history/rebuild` |
| `POST` | `/api/v1/admin/alerts/deliver-daily-email` |
