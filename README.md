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
- Полный продуктовый план: `docs/domarion_analytics_plan.md`.

## Быстрый старт локально

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests
```

API будет доступен:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/api/v1/listings
- http://127.0.0.1:8000/api/v1/reports/object/wr-001.html

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

## Избранное и уведомления

До подключения auth endpoints используют временный `owner_id` query parameter.
По умолчанию используется `demo-user`.

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

1. Подключить PostgreSQL/PostGIS как основной repository вместо in-memory.
2. Реализовать ingestion pipeline для первого легального источника данных.
3. Добавить генерацию HTML/PDF-отчета.
4. Поднять Next.js frontend для поиска, карты и карточки объекта.
5. Добавить Alembic autogenerate-проверку в CI после стабилизации схемы.
