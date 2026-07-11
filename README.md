# Domarion Analytics / Real Estate Intelligence Poland

SaaS-платформа аналитики недвижимости в Польше. Первый технический фокус:
FastAPI backend для поиска объектов, сравнения, скоринга и подготовки отчетов.

## Что уже подготовлено

- `.idea/` удалена из git и добавлена в `.gitignore`.
- Добавлены `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`.
- Добавлен FastAPI-каркас с in-memory данными по объектам во Вроцлаве.
- Добавлены первые формулы `Investment Score`, `Risk Score`, `Negotiation Score`.
- Добавлены API endpoints, Dockerfile, `compose.yaml` с PostGIS и Redis.
- Подготовлены тесты для API и скоринга.
- Добавлен Next.js frontend MVP: поиск, карточки объектов, детальная аналитика, отчеты и alerts.
- Добавлен MapLibre map MVP: GeoJSON endpoint, price markers, radius filter, planned investments и risk/growth overlays.
- Добавлен auth/subscriptions MVP: users, roles, plan limits, `/me`, `/plans`, account page.
- Добавлен paid report MVP: report products, report orders, mock checkout, fulfillment и pricing page.
- Добавлен payment adapter skeleton: `mock` сейчас, подготовка к `stripe`/`payu` через env.
- Добавлен audit trail для paid reports: события заказа, checkout, оплаты и fulfillment.
- Добавлена alerts delivery отправка: email SMTP, Telegram Bot API, dry-run, skip/fail reasons и delivery jobs.
- Добавлены payment webhook endpoints для Stripe/PayU: signature verification, idempotency и auto-fulfillment.
- Добавлен CI/deployment foundation: GitHub Actions, Docker build checks, staging compose и smoke script.
- Добавлен search/compare MVP: pagination, sorting, score-фильтры и страница сравнения объектов.
- Добавлен ingestion admin MVP: ingestion jobs, data-quality logs, raw listings preview и `/admin`.
- Добавлен internal admin CSV upload endpoint для partner listings: dry-run в memory mode и запись в Postgres mode.
- Добавлен source health monitoring для ingestion sources: latest job, warning/error counts и last error.
- Добавлен source registry для legal-first источников: owner, legal status, refresh cadence, allowed use и notes.
- Добавлен scoring backtest v1 по historical price snapshots.
- Добавлен planned investments CRUD: admin API, создание/редактирование/удаление GIS-слоев.
- Добавлен import planned investments из legal JSON/CSV open-data файлов с dry-run и idempotent upsert.
- Добавлены SEO area pages: `/areas`, районные страницы, `sitemap.xml`, `robots.txt`.
- Полный продуктовый план: `docs/domarion_analytics_plan.md`.

## Backend локально

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests
```

Если установлен `make`, основные dev-команды доступны через единый интерфейс:

```powershell
make install
make test
make lint
make backend-dev
make frontend-lint
make frontend-typecheck
make pre-commit-install
make pre-commit
make check
```

Pre-commit hooks запускают `ruff check`, `npm run lint` и `npm run typecheck`.
Для ручной проверки без `make`:

```powershell
.\.venv\Scripts\python.exe -m pre_commit run --all-files
```

API будет доступен:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/api/v1/me
- http://127.0.0.1:8000/api/v1/plans
- http://127.0.0.1:8000/api/v1/report-products
- http://127.0.0.1:8000/api/v1/report-orders
- http://127.0.0.1:8000/api/v1/report-orders/{order_id}/events
- http://127.0.0.1:8000/api/v1/payment-webhooks/stripe
- http://127.0.0.1:8000/api/v1/payment-webhooks/payu
- http://127.0.0.1:8000/api/v1/listings
- http://127.0.0.1:8000/api/v1/admin/ingestion/jobs
- http://127.0.0.1:8000/api/v1/admin/ingestion/sources
- http://127.0.0.1:8000/api/v1/admin/data-quality/logs
- http://127.0.0.1:8000/api/v1/admin/raw-listings
- http://127.0.0.1:8000/api/v1/admin/planned-investments
- http://127.0.0.1:8000/api/v1/alert-delivery-jobs
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
NEXT_PUBLIC_OWNER_ID=demo-user
```

Основные страницы:

- http://127.0.0.1:3000/ — подбор объектов, фильтры, MapLibre-карта, избранное, быстрые отчеты.
- http://127.0.0.1:3000/areas — SEO-страницы районов Вроцлава.
- http://127.0.0.1:3000/areas/wroclaw-fabryczna — пример районной SEO-страницы.
- http://127.0.0.1:3000/listings/wr-001 — детальная аналитика объекта.
- http://127.0.0.1:3000/compare — сравнение 2-5 объектов.
- http://127.0.0.1:3000/reports — история и генерация отчетов.
- http://127.0.0.1:3000/pricing — разовые paid reports, checkout и audit trail.
- http://127.0.0.1:3000/alerts — saved searches, preview и delivery dry-run.
- http://127.0.0.1:3000/account — текущий пользователь, тариф, usage и лимиты.
- http://127.0.0.1:3000/admin — internal ingestion/data-quality dashboard.
- http://127.0.0.1:3000/sitemap.xml — sitemap для SEO.
- http://127.0.0.1:3000/robots.txt — robots rules.

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
.\.venv\Scripts\domarion.exe seed-demo
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion
```

Полезные DB-команды:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic downgrade -1
```

Проверить живую PostgreSQL/PostGIS БД: Alembic migrations, demo seed,
repository search и planned investments CRUD:

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
  --build-arg NEXT_PUBLIC_OWNER_ID=demo-user `
  -t domarion-frontend:local `
  .\frontend
```

Staging-like запуск:

```powershell
docker compose -f compose.staging.yaml up --build
python scripts\smoke_deployment.py
```

## Импорт партнерского CSV

Первый ingestion-формат рассчитан на легальные партнерские или ручные выгрузки,
а не на копирование чужих порталов. Пример файла:
`data/samples/partner_listings_wroclaw.csv`.

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

Минимальные обязательные колонки:

`source_listing_id`, `title`, `source_url`, `city`, `district`, `address`,
`market_type`, `price`, `area_m2`, `rooms`.

Рекомендуемые колонки для production quality: `lat`, `lon`, `building_year`,
`floor`, `building_floors`, инфраструктурные расстояния и quality score.

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
    "website_url": "https://example.com"
  }
}
```

Сгенерировать printable HTML-отчет по demo listing:

```powershell
.\.venv\Scripts\domarion.exe generate-report-html wr-001 data\exports\wr-001-report.html
```

Открыть через API:

```powershell
Start-Process http://127.0.0.1:8000/api/v1/reports/object/wr-001.html
```

HTML рассчитан на печать в PDF через браузер. Это первый отчетный артефакт MVP;
нативный PDF-рендеринг лучше добавлять отдельным шагом после выбора движка.

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

## Auth и тарифные лимиты MVP

Полноценный OAuth/JWT еще не подключен. Для MVP используется header-based identity,
которую позже можно заменить на Clerk/Auth.js/custom JWT без переписывания бизнес-логики.

По умолчанию API использует `demo-user`. Для имитации другого пользователя:

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

Сменить тариф текущего пользователя в MVP-режиме:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/me/subscription `
  -Method Patch `
  -ContentType "application/json" `
  -Body '{"plan":"buyer_pro","status":"active"}'
```

Лимиты уже применяются к favorites, alerts, saved reports и compare items.
Старый `?owner_id=...` работает как fallback для совместимости старых запросов.

## Internal admin MVP

Admin endpoints требуют роль `admin` через MVP identity headers:

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
разовых покупок. `PAYMENT_PROVIDER=mock` работает по умолчанию; `stripe`/`payu` уже вынесены
в adapter interface, но до production нужны реальные SDK/webhooks и verification.

Посмотреть audit trail заказа:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/report-orders/$($checkout.order.id)/events"
```

Webhook endpoints:

- `POST /api/v1/payment-webhooks/stripe` проверяет `Stripe-Signature` через `STRIPE_WEBHOOK_SECRET`.
- `POST /api/v1/payment-webhooks/payu` проверяет `OpenPayU-Signature` через `PAYU_SECOND_KEY`.
- Повторный `provider_event_id` возвращает `duplicate` и не генерирует второй отчет.
- Paid webhook автоматически переводит order в `fulfilled` и создает saved report.

## Избранное и уведомления

Endpoints используют текущего пользователя из headers. Для обратной совместимости
можно временно передавать `owner_id` query parameter. По умолчанию используется `demo-user`.

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

## Следующий технический шаг

1. Запустить `scripts\verify_postgres_staging.py` на живой PostGIS БД после стабилизации Docker Desktop.
2. Подключить CSV/JSON import planned investments к internal admin endpoint.
3. Добавить реальные hosted checkout SDK calls для Stripe/PayU вместо handoff URL skeleton.
4. Добавить SEO structured content для следующих городов.
5. Добавить deployment workflow после выбора hosting.
