# WartoMetr

Продукт поддержки решения о покупке квартиры в Польше:
стоит ли покупать конкретную квартиру по указанной цене?

## Текущее состояние проекта

Проект сейчас состоит из FastAPI backend, Next.js frontend и набора ingestion,
scoring/reporting и ops-инструментов вокруг legal-first данных недвижимости.
Локальные демонстрационные сценарии доступны в `memory`-режиме; для
staging/production предусмотрены PostgreSQL/PostGIS-backed stores, Redis,
S3-compatible report artifacts и worker-процессы.

Основные рабочие контуры:

- поиск и сравнение объектов, hidden gems, карта MapLibre/PostGIS и GeoJSON layers;
- scoring: investment/risk/negotiation/liquidity/rental, fair-price confidence,
  versioned weights и backtesting;
- user-submitted `/check`: ручной ввод или one-off Otodom/OLX URL import без
  массового scraping, без фото/контактов/raw HTML и без публичного source URL leak;
- HTML/PDF reports, saved report history, paid report orders, bundles, mock/Stripe/PayU
  checkout adapters и webhook fulfillment;
- first-party email/password auth с подписанной HttpOnly-сессией, tenant-scoped
  favorites, alerts и reports, plan limits, email/Telegram delivery jobs и daily worker;
- agency workspaces, CRM-light, shared shortlists, API-lite, dataset exports,
  market intelligence и enterprise custom dashboards;
- admin ingestion console: Source Registry, source checks/errors, data quality,
  raw listings preview, corrections, dedup review, planned investments,
  infrastructure imports, developer reputation CRUD/import and moderation;
- frontend routes for buyer/realtor beta, search, maps, check/drafts, reports,
  pricing, alerts, account/CRM, admin, areas, guides, market, news and developers;
- CI/deployment baseline: tests, lint/typecheck/smoke, Docker images,
  staging compose, Oracle Cloud single-VM deployment, Render Blueprint fallback,
  `/ready` production preflight, backups and production ops runbook.

Oracle Cloud deployment is live and working as of 2026-09-01. Paid production
traffic is still gated: live payment secrets, source legal review,
monitoring targets, offsite backups and restore drill must be completed before
selling at scale.

## Основная документация

- `README.md` - quick start, локальный запуск и практические API/CLI examples.
- `docs/api_surface.md` - актуальная карта API surface, сверенная с OpenAPI.
- `docs/deployment.md` - CI, Docker, staging compose, env vars and deployment notes.
- `docs/oci_staging_setup_runbook.md` - active Oracle Cloud runbook: GitHub
  Environment, VM bootstrap, deploy, checks, operations and rollback.
- `docs/production_readiness_audit_2026-09-01.md` - исторический аудит и незакрытые
  production-гейты; не подтверждает текущее состояние deployment.
- `docs/production_ops_runbook.md` - production preflight, managed services,
  backups, S3 artifacts and worker deployment.
- `docs/source_compliance_policy.md` - legal/data guardrails для источников,
  user-submitted URLs, reports, AI and exports.
- `docs/data_governance_retention.md` - retention, raw payload pruning,
  data deletion requests and admin audit.
- `docs/partner_onboarding.md` - Source Registry и partner CSV/API onboarding.
- `docs/hybrid_listing_analysis.md` - фактический `/check` flow и private draft model.
- `docs/developer_reputation_plan.md` - developer ranking/reputation model,
  importer, citations and moderation.
- `docs/paid_beta_playbook.md` - paid beta offers and operational workflow.
- `docs/README.md` - актуальная навигация по документации и статус документов.
- `docs/WartoMetr_Product_Transformation_Master_Prompt.md` - текущая дорожная карта.
- `docs/product_validation_strategy.md` - исторические гипотезы коммерческой валидации.
- `docs/document_upload_due_diligence_plan.md` - future due-diligence document
  upload/metadata flow with minimal retention, redaction and legal guardrails.
- `docs/WartoMetr_Phase_7_Implementation.md` - последний отчёт реализации и проверок.

## Backend локально

По умолчанию in-memory repository пуст и работает в live-режиме. Для локальной
работы с однозначно маркированным deterministic demo dataset включите режим явно:

```powershell
$env:DEMO_MODE_ENABLED="true"
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests
```

Не включайте `DEMO_MODE_ENABLED` в production/staging API. Startup guard разрешает
demo-режим только для local/development/test с `DATA_REPOSITORY_BACKEND=memory`.

Coverage report для backend:

```powershell
.\.venv\Scripts\python.exe -m pytest --cov=domarion --cov-report=term-missing --cov-report=xml
```

Performance smoke для ключевых API:

```powershell
.\.venv\Scripts\python.exe scripts\performance_smoke.py --repeat 3
```

Если установлен `make`, основные dev-команды доступны через единый интерфейс:

```powershell
make install
make test
make lint
make backend-dev
make frontend-lint
make frontend-typecheck
make frontend-smoke
make pre-commit-install
make pre-commit
make check
```

Pre-commit hooks запускают `ruff check`, `npm run lint`, `npm run typecheck`
и `npm run smoke`.
Для ручной проверки без `make`:

```powershell
.\.venv\Scripts\python.exe -m pre_commit run --all-files
```

API будет доступен:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/ready
- http://127.0.0.1:8000/docs

Полная карта текущего backend API: `docs/api_surface.md`. Swagger UI всегда
является источником истины для request/response schemas: `/docs`.

Ключевые endpoint groups:

- http://127.0.0.1:8000/api/v1/me
- http://127.0.0.1:8000/api/v1/plans
- http://127.0.0.1:8000/api/v1/api-lite/listings
- http://127.0.0.1:8000/api/v1/api-lite/listings/{listing_id}
- http://127.0.0.1:8000/api/v1/api-lite/areas/compare
- http://127.0.0.1:8000/api/v1/api-lite/usage
- http://127.0.0.1:8000/api/v1/datasets/listings/export
- http://127.0.0.1:8000/api/v1/market/intelligence-report
- http://127.0.0.1:8000/api/v1/market/dashboard
- http://127.0.0.1:8000/api/v1/scoring/evaluate
- http://127.0.0.1:8000/api/v1/enterprise/custom-dashboards
- http://127.0.0.1:8000/api/v1/agencies/{agency_id}/crm/clients
- http://127.0.0.1:8000/api/v1/crm/shared-shortlists/{share_token}
- http://127.0.0.1:8000/api/v1/report-products
- http://127.0.0.1:8000/api/v1/report-orders
- http://127.0.0.1:8000/api/v1/report-orders/{order_id}/events
- http://127.0.0.1:8000/api/v1/partner-referrals
- http://127.0.0.1:8000/api/v1/payment-webhooks/stripe
- http://127.0.0.1:8000/api/v1/payment-webhooks/payu
- http://127.0.0.1:8000/api/v1/listings
- http://127.0.0.1:8000/api/v1/developers
- http://127.0.0.1:8000/api/v1/developers/{developer_id}
- http://127.0.0.1:8000/api/v1/listings/{listing_id}/developer
- http://127.0.0.1:8000/api/v1/areas/compare
- http://127.0.0.1:8000/api/v1/locations
- http://127.0.0.1:8000/api/v1/infrastructure/transport-stops
- http://127.0.0.1:8000/api/v1/news
- http://127.0.0.1:8000/api/v1/user-submitted-listings/reference-preview
- http://127.0.0.1:8000/api/v1/user-submitted-listings/import-from-url
- http://127.0.0.1:8000/api/v1/user-submitted-listings/analyze
- http://127.0.0.1:8000/api/v1/user-submitted-listings/report
- http://127.0.0.1:8000/api/v1/user-submitted-listings/drafts
- http://127.0.0.1:8000/api/v1/ai-insights
- http://127.0.0.1:8000/api/v1/admin/user-submitted-listing-drafts
- http://127.0.0.1:8000/api/v1/admin/ingestion/jobs
- http://127.0.0.1:8000/api/v1/admin/ingestion/sources
- http://127.0.0.1:8000/api/v1/admin/ingestion/source-health
- http://127.0.0.1:8000/api/v1/admin/ingestion/source-checks
- http://127.0.0.1:8000/api/v1/admin/ingestion/source-errors
- http://127.0.0.1:8000/api/v1/admin/ingestion/sources/prune-retained-raw-payloads
- http://127.0.0.1:8000/api/v1/admin/data-deletion-requests
- http://127.0.0.1:8000/api/v1/admin/audit-logs
- http://127.0.0.1:8000/api/v1/admin/infrastructure/enrich
- http://127.0.0.1:8000/api/v1/admin/infrastructure/import
- http://127.0.0.1:8000/api/v1/admin/data-quality/logs
- http://127.0.0.1:8000/api/v1/admin/raw-listings
- http://127.0.0.1:8000/api/v1/admin/listings/{listing_id}/normalized
- http://127.0.0.1:8000/api/v1/admin/developers/import
- http://127.0.0.1:8000/api/v1/admin/developers/profiles/{developer_id}
- http://127.0.0.1:8000/api/v1/admin/developers/projects/{project_id}
- http://127.0.0.1:8000/api/v1/admin/developers/aliases/{alias_id}
- http://127.0.0.1:8000/api/v1/admin/developers/signals/{signal_id}
- http://127.0.0.1:8000/api/v1/admin/planned-investments
- http://127.0.0.1:8000/api/v1/admin/partner-referrals
- http://127.0.0.1:8000/api/v1/admin/partner-referrals/lead-scores
- http://127.0.0.1:8000/api/v1/admin/alerts/deliver-daily-email
- http://127.0.0.1:8000/api/v1/alert-delivery-jobs
- http://127.0.0.1:8000/api/v1/favorites
- http://127.0.0.1:8000/api/v1/alerts
- http://127.0.0.1:8000/api/v1/map/features
- http://127.0.0.1:8000/api/v1/reports/object/wr-001.html

## Frontend локально

Frontend находится в `frontend/` и по умолчанию ожидает backend на
`http://127.0.0.1:8000`.

```powershell
cd frontend
npm install
npm run lint
npm run typecheck
npm run smoke
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Если backend запущен на другом порту, создай `frontend/.env.local`:

```powershell
Copy-Item .env.example .env.local
```

И измени `NEXT_PUBLIC_API_BASE_URL`, например:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010
```

В обычном local/live режиме персональные API требуют регистрации или входа на
`/account`. Для изолированного демонстрационного сценария включи
`DEMO_MODE_ENABLED=true`; только в local/development/test тогда доступен общий
demo-профиль и legacy identity headers. В production задай уникальный
`AUTH_SESSION_SECRET` длиной не менее 32 символов через secret manager.

Если frontend показывает `Failed to fetch` или `Backend API недоступен`, проверь
`frontend/.env.local`: `NEXT_PUBLIC_API_BASE_URL` должен указывать на реально
запущенный backend, обычно `http://127.0.0.1:8000`.

Основные страницы:

- http://127.0.0.1:3000/beta — public paid-beta landing “проверка квартиры перед покупкой”.
- http://127.0.0.1:3000/realtors — landing variant для риелторов и агентств.
- http://127.0.0.1:3000/ — подбор объектов, фильтры, MapLibre-карта, избранное, быстрые отчеты.
- http://127.0.0.1:3000/check — проверка квартиры по адресу/параметрам, private URL reference и one-off автозаполнение из Otodom/OLX.
- http://127.0.0.1:3000/check/drafts — история private drafts, удаление и генерация saved reports.
- http://127.0.0.1:3000/guides — SEO-гайды: цена за m2, районы, ипотека, checklist и total cost.
- http://127.0.0.1:3000/methodology — публичная методология: fair price, confidence, limits and backtesting.
- http://127.0.0.1:3000/guides/wroclaw-price-per-m2 — пример guide page по цене за m2 во Вроцлаве.
- http://127.0.0.1:3000/areas — SEO-страницы районов Вроцлава.
- http://127.0.0.1:3000/areas/compare — сравнение районов по city baseline, value/growth и market pressure.
- http://127.0.0.1:3000/areas/wroclaw-fabryczna — пример районной SEO-страницы.
- http://127.0.0.1:3000/listings/wr-001 — детальная аналитика объекта.
- http://127.0.0.1:3000/developers — рейтинг застройщиков.
- http://127.0.0.1:3000/compare — сравнение 2-5 объектов.
- http://127.0.0.1:3000/reports — история и генерация отчетов.
- http://127.0.0.1:3000/pricing — разовые paid reports, checkout и audit trail.
- http://127.0.0.1:3000/mortgage — ипотечный расчет и заявка mortgage/legal/renovation партнеру.
- http://127.0.0.1:3000/alerts — saved searches, preview и delivery dry-run.
- http://127.0.0.1:3000/account — текущий пользователь, тариф, usage, agency workspace и CRM-light.
- http://127.0.0.1:3000/admin — internal ingestion/data-quality dashboard.
- http://127.0.0.1:3000/sitemap.xml — sitemap для SEO.
- http://127.0.0.1:3000/robots.txt — robots rules.

Paid beta GTM/offers/workflow описаны в `docs/paid_beta_playbook.md`.

## Запуск инфраструктуры

Скопируй `.env.example` в `.env`, если запускаешь через Docker Compose:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

По умолчанию API использует `DATA_REPOSITORY_BACKEND=memory`, то есть работает без БД.
Чтобы проверить PostgreSQL/PostGIS backend:

```powershell
Copy-Item .env.example .env
(Get-Content .env) -replace 'DATA_REPOSITORY_BACKEND=memory', 'DATA_REPOSITORY_BACKEND=postgres' | Set-Content .env
docker compose up -d db redis
.\.venv\Scripts\python.exe -m alembic upgrade head
$env:DEMO_MODE_ENABLED="true"
.\.venv\Scripts\domarion.exe seed-demo
$env:DEMO_MODE_ENABLED="false"
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion
```

PostgreSQL demo records сохраняют `is_demo=true` и не попадают в live API.
Контейнерный seed запускается только через явный Compose profile `demo`.

Полезные DB-команды:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic downgrade -1
```

Проверить живую PostgreSQL/PostGIS БД: Alembic migrations, demo seed,
repository search, infrastructure enrichment и planned investments CRUD:

```powershell
$env:TEST_DATABASE_URL="postgresql+psycopg://domarion:domarion@localhost:5432/domarion"
.\.venv\Scripts\python.exe scripts\verify_postgres_staging.py --database-url $env:TEST_DATABASE_URL
```

Optional pytest для той же проверки:

```powershell
$env:TEST_DATABASE_URL="postgresql+psycopg://domarion:domarion@localhost:5432/domarion"
.\.venv\Scripts\python.exe -m pytest tests\test_postgres_repository_integration.py
```

## CI и deployment foundation

GitHub Actions проверяет backend, frontend, Alembic SQL generation и Docker build.
Подробности: `docs/deployment.md`.

Локальный Docker build:

```powershell
docker build -t domarion-api:local .
docker build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 `
  -t domarion-frontend:local `
  .\frontend
```

Staging-like запуск:

```powershell
docker compose -f compose.staging.yaml up --build
python scripts\smoke_deployment.py
python scripts\performance_smoke.py --base-url http://127.0.0.1:8000 --repeat 3
```

Oracle Cloud deployment is the active hosted environment. Operational commands,
post-deploy checks, backup timer setup and rollback are documented in
`docs/oci_staging_setup_runbook.md`.

## Импорт партнерского CSV

Первый ingestion-формат рассчитан на легальные партнерские или ручные выгрузки,
а не на копирование чужих порталов. Примеры файлов:
`data/samples/partner_listings_wroclaw.csv` и
`data/samples/partner_listings_suburban.csv`.
Optional колонки для primary-market/developer-aware объектов:
`developer_id`, `developer_name`, `investment_name`, `primary_market_project_id`.
Если они переданы, listing search и developer lookup используют их как
структурные сигналы до текстового matching.

Проверить CSV без записи в БД:

```powershell
.\.venv\Scripts\domarion.exe import-partner-csv data\samples\partner_listings_wroclaw.csv --source-name "Demo Partner" --dry-run
```

Импортировать в PostgreSQL после миграций:

```powershell
.\.venv\Scripts\domarion.exe import-partner-csv data\samples\partner_listings_wroclaw.csv --source-name "Demo Partner"
```

Проверить тот же CSV через internal admin API без записи:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/admin/listings/import-csv `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise" `
  -F "source_name=Demo Partner" `
  -F "dry_run=true" `
  -F "file=@data/samples/partner_listings_wroclaw.csv;type=text/csv"
```

Запись через API требует `INGESTION_ADMIN_STORE_BACKEND=postgres`, чтобы raw listings,
ingestion jobs и data-quality logs сохранялись в одной PostgreSQL/PostGIS БД.

Импорт использует geocoding pipeline v1: если `lat`/`lon` пустые, CSV parser
пытается восстановить координаты через offline Wrocław geocoder по `address`,
`city` и `district`. Такие координаты помечаются в raw payload полями
`geocoding_provider`, `geocoding_precision` и `geocoding_confidence_score`, а
data quality score снижается. Если адрес не покрыт offline geocoder, импорт
останавливается с ошибкой строки.

Импорт также использует deduplication v1: если новый `source_listing_id` похож
на уже известный объект по городу, району, normalized address, market type,
rooms, площади и координатам, создается новый `property_source` для существующей
`property`, а не новый дубль объекта. В таком случае `properties_created` не
растет, а обновляется существующая property.

После записи snapshot importer пересчитывает price history metrics по всей
истории конкретного объявления: `first_seen_at`, `last_seen_at`,
`days_on_market`, `price_reductions`, `price_increases`, текущую цену и
`price_per_m2`. Если CSV содержит `active_status`/`status`, importer сохраняет
нормализованный статус в private snapshot payload. Если CSV содержит
`description_hash`, он сохраняется для события `description_changed`; если
передано поле `description`, importer сохраняет только SHA-256 hash, а не
полный текст описания. Для full-feed импорта можно явно включить
`mark_missing_removed=true`: ранее активные объявления этого источника,
отсутствующие в новом полном snapshot, будут отмечены `removed`, а повторное
появление создаст `republished`. Для уже существующих PostgreSQL snapshots можно выполнить
backfill:

```powershell
.\.venv\Scripts\domarion.exe rebuild-price-history
```

Полный source snapshot через CLI можно импортировать так:

```powershell
.\.venv\Scripts\domarion.exe import-partner-csv data/samples/partner_listings_wroclaw.csv `
  --source-name "Demo Partner" `
  --mark-missing-removed
```

Internal admin API для того же backfill:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/v1/admin/price-history/rebuild `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise"
```

## Импорт данных застройщиков

Developer reputation data импортируется из legal-first JSON-фидов: профили
компаний, aliases, проекты, registry checks, UOKiK events, directory entries,
partner inspection datasets и source-backed quality/legal/transparency signals.
Aliases поддерживают типы `brand`, `legal_entity`, `spv`, `project_company`,
`parent_company`, `source_name`, `other`; они используются для сопоставления
объектов и private `/check` отчетов с нормализованным developer profile.
Evidence sections конвертируются в `DeveloperQualitySignal`, поэтому сразу
попадают в ranking, developer profile и buyer report due diligence. Сигналы
поддерживают moderation/dispute workflow: `under_review` и open dispute не
влияют на score, а `suppressed` скрывается из публичной репутации и отчетов.
Пример: `data/samples/developer_feed_wroclaw.json`.

Проверить фид без записи:

```powershell
.\.venv\Scripts\domarion.exe import-developer-feed data\samples\developer_feed_wroclaw.json --dry-run
```

Импортировать в PostgreSQL после миграций:

```powershell
.\.venv\Scripts\domarion.exe import-developer-feed data\samples\developer_feed_wroclaw.json
```

После импорта рейтинг доступен через `/api/v1/developers`, а lookup для объекта
через `/api/v1/listings/{listing_id}/developer`.

PostGIS infrastructure enrichment пересчитывает для объектов с `geom` поля
`distance_to_center_km`, `nearest_stop_m`, `nearest_school_m`,
`nearest_industrial_zone_m`, `parks_within_1km`, `schools_within_1km` и
`planned_investments_within_2km`, затем синхронизирует эти значения в listing
snapshots. Dry-run показывает diff без записи:

```powershell
curl.exe -X POST "http://127.0.0.1:8000/api/v1/admin/infrastructure/enrich?dry_run=true&limit=1000" `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise"
```

Применить пересчет:

```powershell
curl.exe -X POST "http://127.0.0.1:8000/api/v1/admin/infrastructure/enrich?dry_run=false&limit=1000" `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise"
```

`nearest_major_road_m` пока не пересчитывается: для него нужен отдельный roads/noise
open-data layer.

Минимальные обязательные колонки:

`source_listing_id`, `title`, `source_url`, `city`, `district`, `address`,
`market_type`, `price`, `area_m2`, `rooms`.

Рекомендуемые колонки для production quality: `lat`, `lon`, `building_year`,
`floor`, `building_floors`, инфраструктурные расстояния и quality score.

## Official open-data roadmap

Admin API `GET /api/v1/admin/ingestion/open-data-roadmap` возвращает structured
catalog для legal-first источников: GUS BDL, GUGiK/Geoportal, RCN, SIP/OpenData
Wrocław и OpenStreetMap. Каждый item содержит `domains`, `access_method`,
`ingestion_method`, `documentation_url`, `legal_status`, `refresh_cadence`,
`target_tables`, `next_step` и `risks`.

Фильтры:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/admin/ingestion/open-data-roadmap?domain=transport" `
  -Headers @{"X-Domarion-Role"="admin";"X-Domarion-Plan"="enterprise"}

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/admin/ingestion/open-data-roadmap?status=ready_for_import" `
  -Headers @{"X-Domarion-Role"="admin";"X-Domarion-Plan"="enterprise"}
```

## Импорт infrastructure references

Infrastructure references можно импортировать из JSON/CSV в существующие таблицы:
`transport_stops`, `transport_routes`, `schools`, `kindergartens`, `amenities` и
`industrial_zones`. Это покрывает transport, schools/kindergartens, healthcare,
parks и industrial risk layers. Dry-run работает локально, запись требует
`DATA_REPOSITORY_BACKEND=postgres`.

Пример файла:
`data/samples/infrastructure_references_wroclaw_open_data.json`.

CLI dry-run:

```powershell
.\.venv\Scripts\domarion.exe import-infrastructure-references data\samples\infrastructure_references_wroclaw_open_data.json --dry-run
```

Admin upload dry-run:

```powershell
curl.exe -X POST "http://127.0.0.1:8000/api/v1/admin/infrastructure/import" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise" `
  -F "dry_run=true" `
  -F "source_name=OpenData Wroclaw Sample" `
  -F "file=@data/samples/infrastructure_references_wroclaw_open_data.json;type=application/json"
```

Минимальные поля для point layers: `layer`, `id`, `municipality_id`, `name`,
`lat`, `lon` и layer-specific type field: `stop_type`, `school_type`,
`kindergarten_type`, `amenity_type` или `zone_type`. Для CSV без `layer` можно
передать fallback `--layer schools` в CLI или form field `layer=schools` в API.

## Импорт planned investments

Planned investments можно добавлять вручную через admin CRUD или импортировать из
проверяемых JSON/CSV файлов. Это основной путь для open-data слоев: транспорт,
дороги, школы, парки и другие факторы будущего развития района.

Пример файла на основе публичной страницы Wrocławskiego Programu
Tramwajowo-Autobusowego:
`data/samples/planned_investments_wroclaw_open_data.json`.

Проверить файл без записи:

```powershell
.\.venv\Scripts\domarion.exe import-planned-investments data\samples\planned_investments_wroclaw_open_data.json --source-name "wroclaw.pl WPT" --dry-run
```

Импортировать в текущий repository backend:

```powershell
.\.venv\Scripts\domarion.exe import-planned-investments data\samples\planned_investments_wroclaw_open_data.json --source-name "wroclaw.pl WPT"
```

Минимальные обязательные поля JSON/CSV:

`name`, `investment_type`, `status`, `city`, `lat`, `lon`.

Поддерживаются aliases вроде `title`, `type`, `stage`, `latitude`, `longitude`.
Импорт ищет существующую запись по `source_url + name`, затем по `name + city`,
поэтому повторный запуск обновляет слой, а не создает дубли.

## Scoring weights and versioning

Веса `Risk Score`, `Investment Score` и fair-price mix вынесены в runtime
конфигурацию. Без настройки используется default profile, который сохраняет
текущее поведение. Каждый ответ со score содержит `formula_version` и
`weights_profile`; те же поля сохраняются в metadata сгенерированных отчетов.
Fair price estimate также содержит `fair_price_confidence_score`, который
учитывает качество данных, число comparables и глубину статистики района.

Пример override через `.env`:

```env
SCORING_WEIGHTS_JSON={"investment":{"price_position":0.25,"transport":0.20,"risk_penalty":0.20},"risk":{"pricing":0.30,"market":0.22},"fair_price":{"area_median":0.70,"comparable_median":0.30}}
```

Запустить backtest fair-price scoring на historical price snapshots:

```powershell
.\.venv\Scripts\domarion.exe scoring-backtest --city Wrocław --limit 10
```

Internal admin API:

```powershell
curl.exe "http://127.0.0.1:8000/api/v1/admin/scoring/backtest?city=Wrocław&limit=10" `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise"
```

Зафиксировать текущие area market stats как historical snapshots:

```powershell
.\.venv\Scripts\domarion.exe snapshot-area-markets --dry-run
```

Запись snapshots требует `DATA_REPOSITORY_BACKEND=postgres` и актуальных Alembic
миграций:

```powershell
.\.venv\Scripts\domarion.exe snapshot-area-markets
```

Internal admin dry-run API:

```powershell
curl.exe -X POST "http://127.0.0.1:8000/api/v1/admin/area-market-snapshots?dry_run=true" `
  -H "X-Domarion-User-Id: demo-admin" `
  -H "X-Domarion-Email: admin@domarion.local" `
  -H "X-Domarion-Role: admin" `
  -H "X-Domarion-Plan: enterprise"
```

## HTML-отчеты

Отчеты используют явные templates для `buyer`, `realtor` и `investor`.
Посмотреть доступные шаблоны:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/reports/templates
```

`ObjectReport` содержит `template_code` и `template_name`; при сохранении отчета
они попадают в `report_metadata`.

Для realtor-отчета можно передать optional `branding`:

```json
{
  "listing_id": "wr-001",
  "audience": "realtor",
  "report_format": "html",
  "branding": {
    "agency_name": "Example Realty",
    "agent_name": "Anna Agent",
    "agent_email": "anna@example.com",
    "agent_phone": "+48 500 000 000",
    "website_url": "https://example.com",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#0F766E",
    "accent_color": "#B42318",
    "footer_text": "Prepared by Example Realty.",
    "agency_disclaimer": "Agency materials are informational and require independent diligence."
  }
}
```

Поля `logo_url`, `primary_color`, `accent_color`, `footer_text` и
`agency_disclaimer` являются white-label controls и требуют тариф с
`can_white_label=true` (`realtor`, `agency`, `enterprise`). Basic branding
(`agency_name`, `agent_name`, контакты) остается доступен для realtor report
template без advanced white-label.

Сгенерировать printable HTML-отчет по demo listing:

```powershell
.\.venv\Scripts\domarion.exe generate-report-html wr-001 data\exports\wr-001-report.html
```

Открыть через API:

```powershell
Start-Process http://127.0.0.1:8000/api/v1/reports/object/wr-001.html
```

Скачать native PDF без сохранения отчета в history:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/v1/reports/object/wr-001.pdf `
  -OutFile wr-001-report.pdf
```

PDF генерируется backend-ом из того же HTML/JSON content. На Windows/Linux сервис
пытается встроить системный Unicode TTF-шрифт для русских и польских символов; если
шрифт недоступен, используется безопасный PDF fallback на Helvetica.

## История сгенерированных отчетов

Сгенерировать и сохранить отчет через API:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/reports/object/generate `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"wr-001","audience":"buyer","report_format":"html"}'
```

Получить список сохраненных отчетов:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/reports
```

Проверить email delivery сохраненного отчета без отправки:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/reports/<report_id>/email `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"dry_run":true,"target_email":"client@example.com"}'
```

Фактическая отправка использует те же SMTP настройки, что и email alerts:
`ALERT_EMAIL_ENABLED`, `ALERT_EMAIL_SENDER`, `ALERT_SMTP_HOST`,
`ALERT_SMTP_PORT`, `ALERT_SMTP_USERNAME`, `ALERT_SMTP_PASSWORD`,
`ALERT_SMTP_USE_TLS`.

Получить HTML/JSON content сохраненного отчета:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/v1/reports/{report_id}/content
```

Скачать PDF-версию сохраненного отчета:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/v1/reports/{report_id}/pdf `
  -OutFile domarion-report.pdf
```

## Auth и тарифные лимиты

Основной пользовательский flow использует регистрацию/вход по email и паролю
с подписанной HttpOnly session cookie. Роль и тариф берутся из auth store и не
могут быть изменены caller-controlled headers.

Legacy identity headers и `owner_id` query fallback предназначены только для
явных local/development/test demo fixtures при `DEMO_MODE_ENABLED=true`.
Они запрещены в staging/production и не являются способом аутентификации
публичного пользователя. Для production используй регистрацию/вход и session
cookie.

В изолированном demo-режиме API использует `demo-user`. Чтобы имитировать другого
пользователя локально:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/me `
  -Headers @{
    "X-Domarion-User-Id"="agent-1";
    "X-Domarion-Email"="agent@example.com";
    "X-Domarion-Role"="realtor";
    "X-Domarion-Plan"="realtor"
  }
```

Список тарифных лимитов:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/plans
```

В MVP доступны планы `free`, `buyer_pro`, `investor`, `realtor`, `agency` и `enterprise`.

Сменить тариф текущего пользователя в MVP-режиме:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/me/subscription `
  -Method Patch `
  -ContentType "application/json" `
  -Body '{"plan":"buyer_pro","status":"active"}'
```

Лимиты уже применяются к favorites, alerts, saved reports и compare items.
Старый `?owner_id=...` работает как fallback для совместимости старых запросов.

Agency workspace доступен на планах `agency` и `enterprise`. Owner/admin могут
добавлять участников, менять роли `owner`/`admin`/`agent` и отключать membership;
agent может читать свой workspace без прав управления.

```powershell
$agencyHeaders = @{
  "X-Domarion-User-Id"="agency-owner-1";
  "X-Domarion-Email"="owner@example.com";
  "X-Domarion-Role"="agency_admin";
  "X-Domarion-Plan"="agency"
}

$agency = Invoke-RestMethod http://127.0.0.1:8000/api/v1/agencies `
  -Headers $agencyHeaders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Example Realty","city":"Wrocław","billing_email":"billing@example.com"}'

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/agencies/$($agency.id)/members" `
  -Headers $agencyHeaders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"user_id":"agent-1","email":"agent@example.com","role":"agent"}'
```

CRM-light endpoints позволяют агентству вести клиентов, заметки, shortlist и
client-safe шаринг подборки. Shortlist хранит listing ids/report ids, а в
ответах API обогащается scoring, liquidity/rental, fair price и developer
reputation сигналами из нашей базы; portal `source_url` в public preview не
отдается.

```powershell
$crmClient = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/agencies/$($agency.id)/crm/clients" `
  -Headers $agencyHeaders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"display_name":"Anna Buyer","city":"Wrocław","budget_min":650000,"budget_max":900000,"preferred_rooms":[2,3]}'

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/agencies/$($agency.id)/crm/clients/$($crmClient.id)/notes" `
  -Headers $agencyHeaders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"body":"Client prefers quiet building and tram access.","visibility":"client_shareable","pinned":true}'

$shortlist = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/agencies/$($agency.id)/crm/clients/$($crmClient.id)/shortlists" `
  -Headers $agencyHeaders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"title":"Top options","listing_ids":["wr-001","wr-002"],"client_message":"These are worth discussing before viewings.","share_enabled":true}'

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/crm/shared-shortlists/$($shortlist.share_token)"
```

## Internal admin MVP

В production admin endpoints требуют роль `admin` у аутентифицированной
session. Приведенный ниже header-based пример работает только в local demo
режиме:

```powershell
$headers = @{
  "X-Domarion-User-Id"="admin-1";
  "X-Domarion-Email"="admin@example.com";
  "X-Domarion-Role"="admin";
  "X-Domarion-Plan"="enterprise"
}

Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/ingestion/jobs -Headers $headers
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/data-quality/logs -Headers $headers
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/raw-listings -Headers $headers
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/planned-investments -Headers $headers
```

CSV import теперь создает `ingestion_jobs` и пишет `data_quality_logs` при низком
quality score или отсутствующих optional infrastructure fields:

```powershell
.\.venv\Scripts\domarion.exe import-partner-csv data\samples\partner_listings_wroclaw.csv --source-name "Demo Partner"
```

Создать planned investment вручную:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/planned-investments `
  -Headers $headers `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"New tram corridor","investment_type":"tram","status":"planned","city":"Wrocław","district":"Fabryczna","expected_year":2029,"lat":51.112,"lon":16.968,"confidence_score":60}'
```

## Search API MVP

`/api/v1/listings` возвращает search response, а не голый список:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0,
  "sort": "investment_score_desc",
  "filters": {}
}
```

Пример поиска:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/listings?city=Wrocław&page=1&page_size=2&sort=price_asc&min_investment_score=40&max_risk_score=70"
```

Поддерживаются базовые фильтры по району, комнатам, рынку, цене, price/m2,
площади, days on market, радиусу от точки, data quality и score-фильтры:
Investment, Risk, Negotiation, Liquidity, Rental Potential.

Сравнение объектов:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/compare `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_ids":["wr-001","wr-002"]}'
```

## API-lite для agency/enterprise

Внешний машинный API использует `X-Domarion-API-Key` и доступен только для
ключей с планом `agency` или `enterprise`. В `ENVIRONMENT=local/test`, если
`API_LITE_KEYS_JSON` не задан, доступен dev-key `domarion-local-api-key`.
В production дефолтный ключ не создается.

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/api-lite/listings?city=Wrocław&page_size=5" `
  -Headers @{"X-Domarion-API-Key"="domarion-local-api-key"}
```

Детальная аналитика объекта без `source_url`, контактов, фото, raw HTML и
private user-submitted references:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/api-lite/listings/wr-001 `
  -Headers @{"X-Domarion-API-Key"="domarion-local-api-key"}
```

Сравнение районов и usage summary:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/api-lite/areas/compare?city=Wrocław" `
  -Headers @{"X-Domarion-API-Key"="domarion-local-api-key"}

Invoke-RestMethod http://127.0.0.1:8000/api/v1/api-lite/usage `
  -Headers @{"X-Domarion-API-Key"="domarion-local-api-key"}
```

Production-ключи задаются через env. Можно хранить сам ключ или только SHA-256;
в `.env` значение лучше держать одной строкой:

```env
API_LITE_KEYS_JSON=[{"key_id":"agency-demo","label":"Agency Demo","owner_id":"agency-owner-1","plan":"agency","monthly_quota":5000,"rate_limit_per_minute":120,"scopes":["listings:read","scores:read","areas:read","usage:read"],"key_sha256":"<sha256-of-client-secret>"}]
```

## Dataset exports

Планы с `can_export=true` (`investor`, `realtor`, `agency`, `enterprise`) могут
выгружать нормализованный listing analytics dataset в JSON/CSV. Экспорт строится
из наших legal-first listings, score/fair-price расчетов и area statistics; он
не включает `source_url`, контакты, фото, raw HTML или private URL references.

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/datasets/listings/export?format=json&city=Wrocław&limit=100" `
  -Headers @{"X-Domarion-User-Id"="investor-1";"X-Domarion-Plan"="investor"}

Invoke-WebRequest "http://127.0.0.1:8000/api/v1/datasets/listings/export?format=csv&min_investment_score=60" `
  -Headers @{"X-Domarion-User-Id"="agent-1";"X-Domarion-Plan"="realtor"} `
  -OutFile domarion-listings-dataset.csv
```

## Market intelligence reports

Планы с `can_export=true` могут получить executive market report для трех B2B
аудиторий: `bank`, `developer`, `fund`. Отчет строится на текущем market
dashboard, area comparison и WartoMetr indexes: liquidity, buyer/seller market,
growth, overheating, price/supply momentum. Это аналитический screening report,
не банковская оценка, не инвестиционная рекомендация и не прогноз.

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/market/intelligence-report?audience=bank&city=Wrocław&area_limit=5" `
  -Headers @{"X-Domarion-User-Id"="bank-analyst-1";"X-Domarion-Plan"="enterprise"}

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/market/intelligence-report?audience=developer&city=Wrocław&district=Fabryczna" `
  -Headers @{"X-Domarion-User-Id"="developer-analyst-1";"X-Domarion-Plan"="enterprise"}
```

## Scoring-as-a-service

Планы с `can_use_api=true` (`agency`, `enterprise`) могут оценить объект,
переданный из CRM, underwriting pipeline или partner integration. Endpoint не
требует `source_url`, не сохраняет private draft и возвращает `persisted=false`;
результат содержит score, fair-price range, comparables, risk flags,
recommended actions и developer reputation, если застройщик сопоставлен с нашей
legal-first базой.

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/scoring/evaluate `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="agency-api-1";"X-Domarion-Plan"="enterprise"} `
  -ContentType "application/json" `
  -Body '{
    "external_reference":"crm-lead-4821",
    "address":"Nowy Dwór, Wrocław",
    "city":"Wrocław",
    "district":"Fabryczna",
    "market_type":"secondary",
    "price":675000,
    "area_m2":58.4,
    "rooms":3,
    "floor":3,
    "building_floors":6,
    "building_year":2014,
    "developer_name":"Fabryczna Estate Partners",
    "investment_name":"Nowy Dwór Residence",
    "audience":"underwriting"
  }'
```

## Enterprise custom dashboards

План `enterprise` может сохранять owner-scoped конфигурации кастомных dashboard:
аудитория, город/район, набор widget codes, фильтры, refresh cadence и shared
agency ids. Preview endpoint собирает живую выжимку из market dashboard, area
comparison, market intelligence, developer ranking и scoring distribution.
Виджеты без подключенного enterprise data source помечаются как `planned` или
`needs_data`, чтобы их можно было довести на onboarding.

```powershell
$dashboard = Invoke-RestMethod http://127.0.0.1:8000/api/v1/enterprise/custom-dashboards `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="enterprise-1";"X-Domarion-Plan"="enterprise"} `
  -ContentType "application/json" `
  -Body '{
    "name":"Underwriting Wrocław",
    "audience":"underwriting",
    "city":"Wrocław",
    "district":"Fabryczna",
    "widget_codes":["market_kpis","risk_flags","developer_ranking","api_usage"],
    "refresh_interval_minutes":120,
    "is_default":true
  }'

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/enterprise/custom-dashboards/$($dashboard.id)/preview" `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="enterprise-1";"X-Domarion-Plan"="enterprise"}
```

## Проверка квартиры по адресу/URL

Публичный endpoint анализирует объект, который пользователь ввел вручную. Если
передан `source_url`, он возвращается только как private reference текущего
запроса и не попадает в `analysis.listing.source_url`, UI, SEO или отчеты.
Массовый scheduled scraping порталов в этом flow не выполняется. Для Otodom/OLX
доступен one-off import по ссылке пользователя: backend делает обычный fetch без
anti-bot обхода и пытается извлечь только минимальные поля объекта. Фото,
контакты, full description и raw HTML не сохраняются. По умолчанию создается
private draft на 30 дней; это можно отключить через `save_private_draft=false`
или изменить через `retention_days`.

Проверить ссылку как private reference без загрузки страницы портала:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/reference-preview `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"source_url":"https://www.otodom.pl/pl/oferta/demo-ID4abc123"}'
```

Автозаполнить минимальные поля из Otodom/OLX URL:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/import-from-url `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"source_url":"https://www.otodom.pl/pl/oferta/demo-ID4abc123"}'
```

Если портал блокирует обычный fetch или страница не содержит пригодных
структурированных данных, endpoint вернет `status:"failed"` или
`status:"partial"` и UI оставит ручные поля для подтверждения.

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/analyze `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"address":"Nowy Dwór, Wrocław","city":"Wrocław","district":"Fabryczna","market_type":"secondary","purchase_intent":"family","price":675000,"area_m2":58.4,"rooms":3,"floor":3,"building_floors":6,"building_year":2014,"source_url":"https://www.otodom.pl/pl/oferta/demo","confirm_private_analysis":true}'
```

Frontend flow доступен на `http://127.0.0.1:3000/check`.

Сформировать buyer object-check report из тех же ручных параметров:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/report `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"address":"Nowy Dwór, Wrocław","city":"Wrocław","district":"Fabryczna","market_type":"secondary","purchase_intent":"family","price":675000,"area_m2":58.4,"rooms":3,"floor":3,"building_floors":6,"building_year":2014,"audience":"buyer","confirm_private_analysis":true}'
```

Сохранить report из существующего private draft в `/reports` history:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/drafts/<draft_id>/reports/generate `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"audience":"buyer","report_format":"html"}'
```

Saved report metadata содержит `user_submitted_draft_id` и `source_domain`, но не
содержит полный `source_url_private`.

Создать one-time paid order из private draft можно через существующий checkout
flow, передав `listing_id` как `draft:<draft_id>`:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-orders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"draft:<draft_id>","product_code":"object_report","audience":"buyer"}'
```

Посмотреть private drafts текущего пользователя:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/drafts
```

Удалить draft вручную:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/user-submitted-listings/drafts/<draft_id> `
  -Method Delete
```

Admin list/prune для приватных references:

```powershell
$headers = @{
  "X-Domarion-User-Id"="admin-1";
  "X-Domarion-Role"="admin";
  "X-Domarion-Plan"="enterprise"
}
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/user-submitted-listing-drafts -Headers $headers
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/user-submitted-listing-drafts/prune-expired `
  -Headers $headers `
  -Method Post
```

## Paid report flow MVP

Разовые отчеты работают через order lifecycle:

1. `unpaid` — заказ создан.
2. `paid` — mock payment или verified webhook подтвердил оплату.
3. `fulfilled` — отчет сгенерирован и сохранен в `generated_reports`.

Посмотреть продукты:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-products
```

Создать заказ:

```powershell
$checkout = Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-orders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"wr-001","product_code":"object_report","report_format":"html"}'
```

Для B2B checkout можно передать invoice/VAT metadata. Backend нормализует NIP/VAT,
хранит детали на owner-scoped order и добавляет invoice summary в audit events и
payment provider metadata:

```powershell
$checkout = Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-orders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "listing_id":"wr-001",
    "product_code":"object_report",
    "report_format":"html",
    "billing_details":{
      "invoice_requested":true,
      "customer_type":"company",
      "company_name":"Example Realty Sp. z o.o.",
      "vat_id":"PL1234567890",
      "country_code":"PL",
      "street_address":"Rynek 1",
      "postal_code":"50-101",
      "city":"Wrocław",
      "email":"billing@example.com"
    }
  }'
```

Для расширенного paid artifact используйте `product_code:"full_object_analysis"`. Fulfillment
сохранит отчет с template `full_object_analysis_v1`, расширенными due-diligence, offer strategy
и scenario sections.

Создать платный отчет по району можно тем же lifecycle, передав area reference:

```powershell
$checkout = Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-orders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"area:wroclaw-fabryczna","product_code":"area_report","report_format":"html"}'
```

Пакет 5 report credits покупается как отдельный order. После fulfillment credits видны в
`/api/v1/me` как `usage.report_credits_available` и списываются, когда monthly report limit уже
исчерпан:

```powershell
$checkout = Invoke-RestMethod http://127.0.0.1:8000/api/v1/report-orders `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"bundle:reports-5","product_code":"report_bundle_5","report_format":"html"}'
```

Оплатить через mock checkout:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000$($checkout.checkout_url)" -Method Post
```

Сгенерировать оплаченный отчет:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/report-orders/$($checkout.order.id)/fulfill" `
  -Method Post
```

Paid fulfillment не расходует подписочный monthly report limit. Это MVP-модель для
разовых покупок. `PAYMENT_PROVIDER=mock` работает по умолчанию. Для hosted checkout
можно включить Stripe или PayU через env, при этом order lifecycle и webhook fulfillment
остаются теми же.

Stripe Checkout:

```env
PAYMENT_PROVIDER=stripe
PAYMENT_CHECKOUT_BASE_URL=https://app.example.com
PAYMENT_SUCCESS_URL=https://app.example.com/pricing?payment=success&order_id={order_id}
PAYMENT_CANCEL_URL=https://app.example.com/pricing?payment=cancel&order_id={order_id}
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

PayU hosted order:

```env
PAYMENT_PROVIDER=payu
PAYMENT_CHECKOUT_BASE_URL=https://app.example.com
PAYU_API_BASE_URL=https://secure.snd.payu.com
PAYU_CLIENT_ID=...
PAYU_CLIENT_SECRET=...
PAYU_MERCHANT_POS_ID=...
PAYU_NOTIFY_URL=https://api.example.com/api/v1/payment-webhooks/payu
PAYU_SECOND_KEY=...
```

`PAYMENT_CHECKOUT_BASE_URL` используется как fallback для success/cancel URLs:
`/pricing?payment=<status>&order_id=<order_id>`. В production лучше задавать явные
`PAYMENT_SUCCESS_URL` и `PAYMENT_CANCEL_URL`.

Посмотреть audit trail заказа:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/report-orders/$($checkout.order.id)/events"
```

Экспортировать saved reports можно на планах с `can_export=true` (`realtor`, `agency`,
`enterprise`). Export owner-scoped и не включает полный HTML/JSON content, только summary,
content URL, PDF URL и report metadata:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/reports/export?format=json" `
  -Headers @{"X-Domarion-User-Id"="agent-1";"X-Domarion-Plan"="realtor"}
```

```powershell
Invoke-WebRequest "http://127.0.0.1:8000/api/v1/reports/export?format=csv" `
  -Headers @{"X-Domarion-User-Id"="agent-1";"X-Domarion-Plan"="realtor"} `
  -OutFile domarion-reports.csv
```

Report artifact storage можно включить отдельно от основного `REPORT_STORE_BACKEND`.
По умолчанию `REPORT_ARTIFACT_STORAGE_BACKEND=disabled`, поэтому существующий режим
хранения отчета в БД не меняется. Для local artifact mirror:

```env
REPORT_ARTIFACT_STORAGE_BACKEND=local
REPORT_ARTIFACT_LOCAL_DIR=.domarion/report-artifacts
REPORT_ARTIFACT_PUBLIC_BASE_URL=
```

Для S3-compatible bucket (AWS S3, MinIO, Cloudflare R2 и аналоги):

```env
REPORT_ARTIFACT_STORAGE_BACKEND=s3
REPORT_ARTIFACT_S3_ENDPOINT_URL=https://s3.example.com
REPORT_ARTIFACT_S3_REGION=eu-central-1
REPORT_ARTIFACT_S3_BUCKET=domarion-artifacts
REPORT_ARTIFACT_S3_PREFIX=domarion/reports
REPORT_ARTIFACT_S3_ACCESS_KEY_ID=...
REPORT_ARTIFACT_S3_SECRET_ACCESS_KEY=...
REPORT_ARTIFACT_PUBLIC_BASE_URL=https://cdn.example.com
```

После сохранения отчета `report_metadata` получает `artifact_storage_backend`,
`artifact_storage_key`, `artifact_content_sha256`, `artifact_size_bytes` и optional
`artifact_public_url`. `/api/v1/reports/{report_id}/content` остается owner-scoped и
продолжает работать через существующий report API.

Webhook endpoints:

- `POST /api/v1/payment-webhooks/stripe` проверяет `Stripe-Signature` через `STRIPE_WEBHOOK_SECRET`.
- `POST /api/v1/payment-webhooks/payu` проверяет `OpenPayU-Signature` через `PAYU_SECOND_KEY`.
- Повторный `provider_event_id` возвращает `duplicate` и не генерирует второй отчет.
- Paid webhook автоматически переводит order в `fulfilled` и создает saved report.

## Partner referrals MVP

Создать заявку партнеру из mortgage/legal/renovation flow:

```powershell
$lead = Invoke-RestMethod http://127.0.0.1:8000/api/v1/partner-referrals `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="buyer-1";"X-Domarion-Email"="buyer@example.com"} `
  -ContentType "application/json" `
  -Body '{"referral_type":"mortgage","city":"Wrocław","contact_phone":"+48 500 000 001","consent_to_contact":true}'
```

Обработать заявку в internal admin queue:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/admin/partner-referrals/$($lead.id)" `
  -Method Patch `
  -Headers @{"X-Domarion-User-Id"="admin-1";"X-Domarion-Role"="admin";"X-Domarion-Plan"="enterprise"} `
  -ContentType "application/json" `
  -Body '{"status":"qualified","assigned_to":"ops@example.com","notes":"Ready to hand off."}'
```

Приоритизировать очередь для mortgage/broker handoff:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/admin/partner-referrals/lead-scores?referral_type=mortgage&min_score=60" `
  -Headers @{"X-Domarion-User-Id"="admin-1";"X-Domarion-Role"="admin";"X-Domarion-Plan"="enterprise"}

Invoke-RestMethod "http://127.0.0.1:8000/api/v1/admin/partner-referrals/$($lead.id)/lead-score" `
  -Headers @{"X-Domarion-User-Id"="admin-1";"X-Domarion-Role"="admin";"X-Domarion-Plan"="enterprise"}
```

## Избранное и уведомления

В local demo режиме endpoints используют текущего demo-пользователя из headers.
Для обратной совместимости можно временно передавать `owner_id` query parameter.
В staging/production нужен аутентифицированный session; caller не выбирает
чужой owner id.

Добавить объект в избранное:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/favorites?owner_id=buyer-1 `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"listing_id":"wr-001","note":"Проверить транспортные планы"}'
```

Создать saved search alert:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/alerts?owner_id=buyer-1 `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Fabryczna до 700k","filters":{"city":"Wrocław","district":"Fabryczna","max_price":700000,"min_investment_score":40}}'
```

Посмотреть, какие объекты сейчас подходят под alert:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/alerts/{alert_id}/preview?owner_id=buyer-1
```

Запустить delivery dry-run:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/alerts/{alert_id}/deliver?owner_id=buyer-1 `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"dry_run":true,"max_matches":5}'
```

Запустить реальную отправку после настройки `ALERT_EMAIL_*` или `ALERT_TELEGRAM_*`:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/alerts/{alert_id}/deliver?owner_id=buyer-1 `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"dry_run":false,"max_matches":5}'
```

Посмотреть историю delivery jobs:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/alert-delivery-jobs?owner_id=buyer-1
```

Запустить daily email alerts batch dry-run для всех due alerts:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/alerts/deliver-daily-email `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="admin-1";"X-Domarion-Role"="admin"} `
  -ContentType "application/json" `
  -Body '{"dry_run":true,"max_matches":10,"limit":500}'
```

Live-run пишет delivery jobs и не повторяет тот же daily email alert в течение 24 часов:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/admin/alerts/deliver-daily-email `
  -Method Post `
  -Headers @{"X-Domarion-User-Id"="admin-1";"X-Domarion-Role"="admin"} `
  -ContentType "application/json" `
  -Body '{"dry_run":false,"max_matches":10,"limit":500}'
```

CLI для cron/background worker:

```powershell
.\.venv\Scripts\domarion.exe deliver-daily-email-alerts --send --max-matches 10 --limit 500
```

Production worker loop:

```powershell
$env:WORKER_TASKS="daily-email-alerts,area-market-snapshots"
$env:WORKER_INTERVAL_SECONDS="3600"
.\.venv\Scripts\domarion.exe worker
```

Production readiness preflight:

```powershell
.\.venv\Scripts\domarion.exe production-preflight
.\.venv\Scripts\domarion.exe production-preflight --strict
```

Postgres/PostGIS logical backup:

```powershell
python scripts/postgres_backup.py backup --database-url $env:DATABASE_URL
python scripts/postgres_backup.py restore .domarion/backups/postgres/domarion-postgres-YYYYMMDDTHHMMSSZ.dump --database-url $env:RESTORE_DATABASE_URL --clean
```

Full production operations checklist: `docs/production_ops_runbook.md`.
Active Oracle Cloud operations runbook: `docs/oci_staging_setup_runbook.md`.
Paid-beta readiness audit: `docs/production_readiness_audit_2026-09-01.md`.
Inactive Render fallback and Blueprint notes: `docs/deployment.md`.
Poland city expansion readiness checklist: `docs/poland_city_expansion_checklist.md`.

## Git workflow

Перед началом работы:

```powershell
git status --short --branch
git pull --ff-only
```

Нормальный рабочий цикл:

```powershell
git checkout -b feature/mvp-api-foundation
.\.venv\Scripts\python.exe -m pytest
git add .
git commit -m "Build initial API foundation"
git push -u origin feature/mvp-api-foundation
```

## Дальнейшая работа

Порядок реализации: `docs/WartoMetr_Product_Transformation_Master_Prompt.md`.
Результаты фаз 0–7 и ограничения проверок перечислены в `docs/README.md`.
Перед платным production нужны отдельные подтверждения live checkout/webhook,
доставки уведомлений, backup/restore, monitoring и source/legal approval.
Локальные тесты и старые аудитные отчёты не заменяют эти подтверждения.
