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
- Добавлен alerts delivery skeleton: email/Telegram dry-run, skip reasons и delivery jobs.
- Добавлен CI/deployment foundation: GitHub Actions, Docker build checks, staging compose и smoke script.
- Добавлен search/compare MVP: pagination, sorting, score-фильтры и страница сравнения объектов.
- Добавлен ingestion admin MVP: ingestion jobs, data-quality logs, raw listings preview и `/admin`.
- Добавлен planned investments CRUD: admin API, создание/редактирование/удаление GIS-слоев.
- Добавлены SEO area pages: `/areas`, районные страницы, `sitemap.xml`, `robots.txt`.
- Полный продуктовый план: `docs/domarion_analytics_plan.md`.

## Backend локально

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests
```

API будет доступен:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/api/v1/me
- http://127.0.0.1:8000/api/v1/plans
- http://127.0.0.1:8000/api/v1/report-products
- http://127.0.0.1:8000/api/v1/report-orders
- http://127.0.0.1:8000/api/v1/report-orders/{order_id}/events
- http://127.0.0.1:8000/api/v1/listings
- http://127.0.0.1:8000/api/v1/admin/ingestion/jobs
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

Минимальные обязательные колонки:

`source_listing_id`, `title`, `source_url`, `city`, `district`, `address`,
`market_type`, `price`, `area_m2`, `rooms`, `lat`, `lon`.

## HTML-отчеты

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
2. `paid` — mock payment подтвержден.
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

1. Подключить реальные PayU/Stripe SDK, webhooks и payment verification.
2. Подключить реальные open-data слои planned investments вместо demo layer.
3. Реализовать фактическую SMTP/Telegram отправку поверх delivery skeleton.
4. Добавить SEO structured content для следующих городов.
5. Добавить deployment workflow после выбора hosting.
