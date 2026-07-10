# Deployment и CI

Цель этого документа: дать минимальный, проверяемый путь от локальной разработки к
staging/demo окружению. Это не production playbook для банка; это foundation для paid beta.

## Что проверяет CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

Jobs:

- `Backend`: Python 3.12, `ruff`, `pytest`, offline-проверка Alembic migrations.
- `Frontend`: Node 22, `npm ci`, `lint`, `typecheck`, `npm audit --audit-level=moderate`, `next build`.
- `Docker Build`: сборка backend image и frontend image без публикации registry.

Локальный эквивалент:

```powershell
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m alembic upgrade head --sql

cd frontend
npm ci
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npm run build
```

## Docker images

Backend:

```powershell
docker build -t domarion-api:local .
```

Frontend:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 `
  --build-arg NEXT_PUBLIC_OWNER_ID=demo-user `
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 `
  -t domarion-frontend:local `
  .\frontend
```

Важно: `NEXT_PUBLIC_API_BASE_URL` в Next.js вшивается в frontend bundle на этапе build.
Для staging/prod нужно собирать frontend image с публичным URL API конкретного окружения.

## Staging через Docker Compose

Файл: `compose.staging.yaml`.

Состав:

- `db`: PostGIS.
- `redis`: Redis.
- `migrate`: одноразовый запуск Alembic migrations.
- `seed`: idempotent demo seed для staging.
- `api`: FastAPI backend.
- `frontend`: Next.js standalone server.

Запуск:

```powershell
docker compose -f compose.staging.yaml up --build
```

Smoke check:

```powershell
python scripts\smoke_deployment.py
```

Если порты отличаются:

```powershell
$env:API_BASE_URL="http://127.0.0.1:8010"
$env:FRONTEND_BASE_URL="http://127.0.0.1:3001"
python scripts\smoke_deployment.py
```

## Переменные окружения

Минимум для backend:

| Переменная | Назначение | MVP default |
| --- | --- | --- |
| `APP_NAME` | Название API | `Domarion Analytics API` |
| `ENVIRONMENT` | `local`, `staging`, `production` | `local` |
| `DATABASE_URL` | PostgreSQL/PostGIS connection string | memory/local в dev |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CORS_ORIGINS` | JSON-массив frontend origins | localhost origins |
| `DATA_REPOSITORY_BACKEND` | `memory` или `postgres` | `memory` |
| `REPORT_STORE_BACKEND` | `memory` или `postgres` | `memory` |
| `REPORT_ORDER_STORE_BACKEND` | `memory` или `postgres` | `memory` |
| `USER_STORE_BACKEND` | `memory` или `postgres` | `memory` |
| `AUTH_STORE_BACKEND` | `memory` или `postgres` | `memory` |
| `INGESTION_ADMIN_STORE_BACKEND` | `memory` или `postgres` | `memory` |
| `PAYMENT_PROVIDER` | `mock`, `stripe` или `payu` | `mock` |
| `PAYMENT_CHECKOUT_BASE_URL` | Base URL для внешнего checkout handoff | пусто |
| `PAYMENT_WEBHOOK_TOLERANCE_SECONDS` | Допуск Stripe timestamp для webhook signature | `300` |
| `STRIPE_WEBHOOK_SECRET` | Endpoint secret для `Stripe-Signature` verification | пусто |
| `PAYU_SECOND_KEY` | PayU second key для `OpenPayU-Signature` verification | пусто |
| `ALERT_EMAIL_ENABLED` | включает skeleton email delivery | `false` |
| `ALERT_EMAIL_SENDER` | отправитель email alerts | `alerts@domarion.local` |
| `ALERT_SMTP_HOST` | SMTP host для будущей отправки | пусто |
| `ALERT_TELEGRAM_ENABLED` | включает skeleton Telegram delivery | `false` |
| `ALERT_TELEGRAM_BOT_NAME` | имя Telegram bot для metadata | `DomarionBot` |
| `ALERT_TELEGRAM_BOT_TOKEN` | token будущего Telegram bot | пусто |
| `DEMO_USER_ID` | fallback user для MVP auth | `demo-user` |
| `DEMO_USER_EMAIL` | fallback email для MVP auth | `demo@domarion.local` |

Минимум для frontend build:

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Публичный URL backend API |
| `NEXT_PUBLIC_OWNER_ID` | Временный MVP owner fallback |
| `NEXT_PUBLIC_SITE_URL` | Публичный URL frontend для sitemap/canonical URLs |

Для реального production нельзя оставлять demo identity как auth-модель. Следующий шаг перед
публичным запуском: заменить header/demo auth на Auth.js/Clerk/custom JWT, подключить реальные
hosted checkout SDK calls для PayU/Stripe и включить delivery только после настройки
SMTP/Telegram secrets.

## Hosting shortlist для MVP

Дата проверки: 2026-07-10. Перед оплатой нужно вручную перепроверить цены, лимиты и поддержку
PostGIS/Redis на официальных страницах.

| Вариант | Когда выбирать | Что проверить |
| --- | --- | --- |
| Railway | Быстрый paid beta, GitHub deploy, минимум DevOps | Лимиты плана, стоимость постоянной БД/Redis, поддержка Docker и volumes: https://railway.com/pricing |
| Render | Простой web service + managed Postgres, понятный dashboard | Стоимость web services, Postgres, Redis/key-value, лимиты free/pro: https://render.com/pricing |
| Fly.io | Если важны EU regions, Docker и будущая география | Стоимость machines/volumes, Postgres story, operational overhead: https://fly.io/docs/about/pricing/ |
| Hetzner VPS + Docker Compose | Самый контролируемый и часто дешевый EU-вариант | Backup, security patching, monitoring, managed DB отсутствие: https://www.hetzner.com/cloud |

Практичная рекомендация для paid beta:

1. Если важна скорость запуска и мало DevOps времени: Railway или Render.
2. Если founder сам ведет backend/infra и хочет контроль расходов: Hetzner VPS + managed backups.
3. Если появятся клиенты из нескольких стран ЕС и latency станет важной: отдельно оценить Fly.io.

## Что еще нужно до production

- Подключить реальный auth.
- Подключить PayU/Stripe SDK hosted checkout calls вместо checkout handoff skeleton.
- Перенести secrets в hosting secret manager.
- Добавить managed backups для Postgres.
- Добавить error tracking и structured logs.
- Добавить отдельный staging домен.
- Добавить registry publish и deploy workflow после выбора hosting.
