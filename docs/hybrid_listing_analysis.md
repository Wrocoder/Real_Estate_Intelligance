# Hybrid User-Provided Listing Analysis

Цель: дать пользователю почти тот же UX, что и “найди объект на портале и сравни”, но не строить MVP на массовом скрапинге чужих баз объявлений.
Source compliance gate для этого flow описан в `docs/source_compliance_policy.md`.

## Product Flow

1. Пользователь открывает “Проверить квартиру”.
2. Вставляет URL объявления или вводит адрес/район, цену, площадь, комнаты и базовые параметры.
3. Для Otodom/OLX система может сделать one-off import минимальных полей без фото, контактов и raw HTML.
4. Пользователь подтверждает/исправляет параметры, затем система нормализует объект, геокодирует адрес и считает data-quality/confidence score.
5. Сравнение строится по нашим legal-first данным: партнерские snapshots, user-owned/manual listings, area statistics, market snapshots, planned investments и open-data слои.
6. Если comparables мало, система делает area-level estimate и явно показывает низкую confidence.
7. Отчет не публикует URL объявления и не показывает пользователям скрытые ссылки на порталы.

## Source URL Policy

- URL хранится только как приватный internal reference/evidence для объекта пользователя.
- URL не индексируется в SEO, не показывается другим пользователям, не экспортируется в публичные отчеты.
- URL не используется для scheduled crawling, bulk indexing или мониторинга портала без отдельного legal approval.
- URL-assisted parsing разрешен только как one-off user-submitted analysis: обычный fetch без anti-bot обхода, без scheduled crawling и bulk indexing.
- One-off import пишет ingestion telemetry как `user_submitted_reference`, но admin job/log metadata хранит только домен, провайдера, статус и извлеченные поля, без полного private URL.
- Не извлекать и не хранить фото, контактные данные, имена частных продавцов, телефоны, email или private notes.
- Пользователь подтверждает, что он имеет право использовать переданные параметры/ссылку для личного анализа.

## Data Model And Persistence

Текущая реализация уже хранит private drafts через
`domarion/user_submitted_listing_store` (`memory` или `postgres` backend).
Публичная база listings при этом не пополняется пользовательскими ссылками.

Request model `UserSubmittedListingRequest` принимает:

- `title`, `source_url`, `developer_id`, `developer_name`, `investment_name`,
  `primary_market_project_id`;
- `address`, `city`, `district`, `market_type`, `price`, `area_m2`, `rooms`;
- optional building/location/enrichment fields: `floor`, `building_floors`,
  `building_year`, `lat`, `lon`, distance/count fields;
- `confirm_private_analysis`, `save_private_draft`, `retention_days`.

`confirm_private_analysis=true` обязателен. Без него backend возвращает ошибку,
потому что пользователь должен явно подтвердить право на private analysis.

Analysis response `UserSubmittedListingAnalysis` содержит:

- обычный `ListingAnalysis` с normalized listing, scores, comparables,
  fair-price, risks, future impact and developer reputation when matched;
- `confidence_score`, `warnings`, `comparables_basis`, `retention_note`;
- `source_url_private` and `source_domain` only for owner-scoped/private handling;
- `draft_id` and `draft_expires_at`, если `save_private_draft=true`.

Persisted draft stores:

- `owner_id`, `listing_id`, `source_url_private`, `source_domain`;
- normalized address, city, district, market type and key property fields;
- developer/project metadata;
- `data_quality_score`, `confidence_score`;
- request and analysis payloads;
- `created_at`, `updated_at`, `expires_at`.

Saved report generation links drafts to `generated_reports` and paid orders via
`listing_id="draft:<draft_id>"`. Report metadata keeps `user_submitted_draft_id`
and `source_domain`, but not the full private URL.

## Analysis Contract

Система должна возвращать:

- normalized draft listing;
- confidence score;
- fair price range;
- comparable area/listing basis;
- warnings по недостающим параметрам;
- planned investments nearby;
- buyer questions/checklist;
- mortgage/total purchase cost section.

## MVP First Slice

Реализовано:

- `POST /api/v1/user-submitted-listings/analyze`;
- `POST /api/v1/user-submitted-listings/reference-preview`;
- `POST /api/v1/user-submitted-listings/import-from-url`;
- `POST /api/v1/user-submitted-listings/report`;
- `GET /api/v1/user-submitted-listings/drafts`;
- `POST /api/v1/user-submitted-listings/drafts/{draft_id}/reports/generate`;
- `GET /api/v1/admin/user-submitted-listing-drafts`;
- `POST /api/v1/admin/user-submitted-listing-drafts/prune-expired`;
- frontend page `/check`;
- private draft persistence без сохранения в публичную базу объектов;
- private handling of `source_url`: реальная ссылка не попадает в `analysis.listing.source_url`;
- data-quality/confidence score для ручного ввода и approximate geocoding;
- comparables из текущего repository, area statistics и open-data/planned investments слоя;
- предупреждение, если используется area-level fallback или district-level defaults;
- buyer object-check report из текущих report templates без сохранения private URL в отчете;
- owner-scoped draft access, manual deletion, `expires_at` и admin prune для retention;
- saved report generation из draft в существующую `/reports` history без полного private URL в report metadata/content;
- paid report order lifecycle для draft references через `listing_id="draft:<draft_id>"`;
- one-off URL import для Otodom/OLX: минимальные поля объекта, status `extracted/partial/failed/unsupported`, fallback на ручное подтверждение;
- source registry entry `user_submitted_reference` и sanitized ingestion telemetry для monitoring import failures без раскрытия full private URL.

Открытые ограничения: live PSP checkout требует production credentials и
end-to-end payment testing; source-specific legal review остается обязательным
перед любым scheduled/bulk portal ingestion; URL fixture corpus нужно расширять
только реальными one-off edge cases.

## Non-Goals For MVP

- Массовый crawler Otodom/OLX/Morizon.
- Обход anti-bot, captcha, login, paywall или rate limits.
- Публичное отображение чужих source URLs.
- Републикация описаний, фото или контактов продавцов.
- Claims вроде “официальная цена рынка” без confidence/disclaimer.
