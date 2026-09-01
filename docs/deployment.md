# Deployment и CI

Цель этого документа: дать минимальный, проверяемый путь от локальной разработки к
staging/demo окружению. Это не production playbook для банка; это foundation для paid beta.

## Что проверяет CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

OCI-specific post-push setup lives in `docs/oci_staging_setup_runbook.md`.

Jobs:

- `Backend`: Python 3.12, `ruff`, `pytest` с coverage report, performance smoke,
  offline-проверка Alembic migrations.
- `Frontend`: Node 22, `npm ci`, `lint`, `typecheck`, frontend smoke,
  `npm audit --audit-level=moderate`, `next build`.
- `Docker Build`: сборка backend image и frontend image без публикации registry.
- `Publish OCI Images`: условная публикация linux/arm64 images в GHCR после
  backend/frontend checks. По push в `main` job запускается только если
  `OCI_IMAGE_PUBLISH_ENABLED=true`; вручную запускается через `workflow_dispatch`
  с `publish_images=true`.

Локальный эквивалент:

```powershell
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m pytest --cov=domarion --cov-report=term-missing --cov-report=xml
.\.venv\Scripts\python.exe scripts\performance_smoke.py --repeat 3
.\.venv\Scripts\python.exe -m alembic upgrade head --sql

cd frontend
npm ci
npm run lint
npm run typecheck
npm run smoke
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

OCI/GHCR image publishing expects GitHub Actions variables:

- `OCI_IMAGE_PUBLISH_ENABLED=true` to publish after `main` CI passes.
- `OCI_NEXT_PUBLIC_API_BASE_URL`, for example `https://api.example.com`.
- `OCI_NEXT_PUBLIC_SITE_URL`, for example `https://app.example.com`.
- `OCI_NEXT_PUBLIC_OWNER_ID`, optional, defaults to `demo-user`.

The published tags are `sha-<commit>` and `latest-arm64` for:

- `ghcr.io/<owner>/domarion-api`
- `ghcr.io/<owner>/domarion-frontend`
- `ghcr.io/<owner>/domarion-postgis`

OCI staging deploy is a protected `workflow_dispatch` path. Configure GitHub
Environment `oci-staging` with manual approval, then set:

- Secrets: `OCI_DEPLOY_HOST`, `OCI_SSH_PRIVATE_KEY`, `OCI_SSH_KNOWN_HOSTS`,
  `OCI_ENV_FILE`.
- Optional secrets for private GHCR packages: `OCI_GHCR_USERNAME`,
  `OCI_GHCR_READ_TOKEN`.
- Variables: `OCI_DEPLOY_USER` default `domarion`, `OCI_DEPLOY_PORT` default `22`.

Manual deploy with `deploy_oci=true` publishes fresh `sha-<commit>` arm64
images, snapshots the previous remote env file under
`/srv/domarion/env/snapshots`, writes the new env file and runs
`scripts/deploy_oracle_cloud.sh --pull-images` on the VM.

OCI logical Postgres backups can be scheduled on the VM with:

```bash
sudo cp deploy/oracle/domarion-postgres-backup.service /etc/systemd/system/domarion-postgres-backup.service
sudo cp deploy/oracle/domarion-postgres-backup.timer /etc/systemd/system/domarion-postgres-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now domarion-postgres-backup.timer
```

The OCI compose file sets conservative default PostgreSQL values for a 2 OCPU,
12 GB RAM VM: 50 connections, 1 GB shared buffers, 6 GB effective cache,
256 MB maintenance work memory and 16 MB work memory. Override them in
`/srv/domarion/env/oracle.env` only after observing real memory pressure.

On a fresh Ubuntu OCI VM, use `sudo scripts/bootstrap_oracle_vm.sh` after copying
or cloning the repo. Pass `--harden-ssh` only after key-based SSH access is
verified.

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
python scripts\performance_smoke.py --base-url http://127.0.0.1:8000 --repeat 3
```

PostgreSQL/PostGIS verification без frontend build:

```powershell
$env:TEST_DATABASE_URL="postgresql+psycopg://domarion:domarion@localhost:5432/domarion"
python scripts\verify_postgres_staging.py --database-url $env:TEST_DATABASE_URL
```

Что проверяет verifier:

- Alembic `upgrade head`.
- Наличие PostGIS через `postgis_full_version()`.
- Demo seed.
- PostgreSQL repository для listings, area statistics, price history и comparables.
- Planned investments create/update/delete.

Если порты отличаются:

```powershell
$env:API_BASE_URL="http://127.0.0.1:8010"
$env:FRONTEND_BASE_URL="http://127.0.0.1:3001"
python scripts\smoke_deployment.py
```

## Переменные окружения

Фактический список backend-настроек задается в `domarion/core/config.py`, а
sample values лежат в `.env.example`. Для локальной разработки почти все
persistent stores по умолчанию работают в `memory`-режиме. Для production
`/ready` и `domarion production-preflight` требуют PostgreSQL-backed stores для
всех persisted domains.

Core runtime:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `APP_NAME` | Название API | `Domarion Analytics API` |
| `ENVIRONMENT` | `local`, `staging`, `production` | `local` |
| `DATABASE_URL` | PostgreSQL/PostGIS connection string | local Docker Postgres |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CORS_ORIGINS` | JSON-массив frontend origins | localhost origins |
| `LOG_LEVEL` | уровень `domarion.*` логов | `INFO` |
| `SENTRY_DSN` | включает Sentry error tracking, если задан | пусто |
| `SENTRY_TRACES_SAMPLE_RATE` | доля performance traces для Sentry от `0` до `1` | `0` |

Persistent stores:

| Переменная | Назначение | Local default | Production |
| --- | --- | --- | --- |
| `DATA_REPOSITORY_BACKEND` | listings, areas, map data, ingestion targets | `memory` | `postgres` |
| `REPORT_STORE_BACKEND` | saved generated reports | `memory` | `postgres` |
| `REPORT_ORDER_STORE_BACKEND` | paid report orders, events and webhooks | `memory` | `postgres` |
| `USER_STORE_BACKEND` | account usage and subscription state | `memory` | `postgres` |
| `AUTH_STORE_BACKEND` | favorites, alerts and MVP auth state | `memory` | `postgres` |
| `AGENCY_STORE_BACKEND` | agency workspaces and memberships | `memory` | `postgres` |
| `CRM_STORE_BACKEND` | CRM clients, notes and shortlists | `memory` | `postgres` |
| `INGESTION_ADMIN_STORE_BACKEND` | jobs, logs, sources, audit and deletion requests | `memory` | `postgres` |
| `USER_SUBMITTED_LISTING_STORE_BACKEND` | private drafts and source references | `memory` | `postgres` |
| `PARTNER_REFERRAL_STORE_BACKEND` | beta/partner leads and scores | `memory` | `postgres` |
| `AI_INSIGHT_STORE_BACKEND` | stored AI summaries and answers | `memory` | `postgres` |
| `NEWS_STORE_BACKEND` | news articles and admin edits | `memory` | `postgres` |
| `CUSTOM_DASHBOARD_STORE_BACKEND` | enterprise dashboard configs | `memory` | `postgres` |

Production preflight requires every store above to be `postgres`.

Report artifacts:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `REPORT_ARTIFACT_STORAGE_BACKEND` | `disabled`, `local` или `s3` artifact mirror | `disabled` |
| `REPORT_ARTIFACT_LOCAL_DIR` | local artifact directory | `.domarion/report-artifacts` |
| `REPORT_ARTIFACT_PUBLIC_BASE_URL` | optional public/CDN base URL | пусто |
| `REPORT_ARTIFACT_S3_ENDPOINT_URL` | S3-compatible endpoint, например R2/MinIO | пусто |
| `REPORT_ARTIFACT_S3_REGION` | S3 region | `eu-central-1` |
| `REPORT_ARTIFACT_S3_BUCKET` | bucket для HTML/JSON/PDF artifacts | пусто |
| `REPORT_ARTIFACT_S3_PREFIX` | prefix внутри bucket | `domarion/reports` |
| `REPORT_ARTIFACT_S3_ACCESS_KEY_ID` | S3 access key | пусто |
| `REPORT_ARTIFACT_S3_SECRET_ACCESS_KEY` | S3 secret key | пусто |

Payments:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `PAYMENT_PROVIDER` | `mock`, `stripe` или `payu` | `mock` |
| `PAYMENT_CHECKOUT_BASE_URL` | Base URL для внешнего checkout handoff | пусто |
| `PAYMENT_SUCCESS_URL` | success redirect URL/template | пусто |
| `PAYMENT_CANCEL_URL` | cancel redirect URL/template | пусто |
| `PAYMENT_CHECKOUT_TIMEOUT_SECONDS` | timeout для hosted checkout calls | `10` |
| `STRIPE_SECRET_KEY` | Stripe API secret | пусто |
| `STRIPE_API_BASE_URL` | Stripe API base URL | `https://api.stripe.com` |
| `PAYMENT_WEBHOOK_TOLERANCE_SECONDS` | Допуск Stripe timestamp для webhook signature | `300` |
| `STRIPE_WEBHOOK_SECRET` | Endpoint secret для `Stripe-Signature` verification | пусто |
| `PAYU_API_BASE_URL` | PayU API base URL | `https://secure.snd.payu.com` |
| `PAYU_CLIENT_ID` | PayU OAuth client id | пусто |
| `PAYU_CLIENT_SECRET` | PayU OAuth secret | пусто |
| `PAYU_MERCHANT_POS_ID` | PayU POS id | пусто |
| `PAYU_NOTIFY_URL` | webhook notify URL | пусто |
| `PAYU_CUSTOMER_IP` | customer IP fallback для PayU order | `127.0.0.1` |
| `PAYU_SECOND_KEY` | PayU second key для `OpenPayU-Signature` verification | пусто |

Alerts and workers:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `ALERT_EMAIL_ENABLED` | включает SMTP email delivery | `false` |
| `ALERT_EMAIL_SENDER` | отправитель email alerts | `alerts@domarion.local` |
| `ALERT_SMTP_HOST` | SMTP host для email alerts | пусто |
| `ALERT_SMTP_PORT` | SMTP port | `587` |
| `ALERT_SMTP_USERNAME` | SMTP username, если нужен login | пусто |
| `ALERT_SMTP_PASSWORD` | SMTP password, если нужен login | пусто |
| `ALERT_SMTP_USE_TLS` | включает STARTTLS | `true` |
| `ALERT_DELIVERY_TIMEOUT_SECONDS` | timeout SMTP/Telegram delivery | `10` |
| `ALERT_TELEGRAM_ENABLED` | включает Telegram Bot API delivery | `false` |
| `ALERT_TELEGRAM_BOT_NAME` | имя Telegram bot для metadata | `DomarionBot` |
| `ALERT_TELEGRAM_BOT_TOKEN` | token будущего Telegram bot | пусто |
| `ALERT_TELEGRAM_API_BASE_URL` | Telegram API base URL | `https://api.telegram.org` |
| `WORKER_TASKS` | comma-separated tasks: `daily-email-alerts`, `area-market-snapshots`, `price-history-rebuild` | `daily-email-alerts` |
| `WORKER_INTERVAL_SECONDS` | delay между worker loops | `3600` |
| `WORKER_RUN_ONCE` | run worker once and exit | `false` |
| `WORKER_APPLY` | persist maintenance tasks | `false` |
| `WORKER_FORCE` | ignore cooldowns where supported | `false` |
| `ALERT_WORKER_SEND` | send daily email alerts instead of dry-run | `false` |
| `ALERT_WORKER_MAX_MATCHES` | max matches per alert delivery | `10` |
| `ALERT_WORKER_LIMIT` | max active alerts scanned per batch | `500` |

API-lite:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `API_LITE_KEYS_JSON` | configured API-lite keys or SHA-256 hashes | пусто |
| `API_LITE_DEFAULT_MONTHLY_QUOTA` | quota для key без явного override | `1000` |
| `API_LITE_DEFAULT_RATE_LIMIT_PER_MINUTE` | per-minute limit для key без override | `60` |

Backups and production preflight markers:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `BACKUP_OUTPUT_DIR` | local logical backup output dir | `.domarion/backups/postgres` |
| `BACKUP_PREFIX` | filename prefix for dumps | `domarion-postgres` |
| `BACKUP_RETENTION_DAYS` | local backup retention | `14` |
| `BACKUP_MAX_AGE_HOURS` | freshness window for `/ready`/preflight backup check | `30` |
| `BACKUP_S3_BUCKET` | offsite backup bucket, required by production preflight | пусто |
| `BACKUP_S3_PREFIX` | offsite backup prefix | `domarion/postgres` |
| `BACKUP_S3_ENDPOINT_URL` | S3-compatible backup endpoint | пусто |
| `BACKUP_S3_REGION` | backup S3 region | `eu-central-1` |
| `PG_DUMP_BIN` | pg_dump binary name/path | `pg_dump` |
| `PG_RESTORE_BIN` | pg_restore binary name/path | `pg_restore` |
| `UPTIME_MONITOR_URL` | external uptime monitor target | пусто |
| `JOB_FAILURE_ALERT_TARGET` | destination for worker failure alerts | пусто |
| `SOURCE_FRESHNESS_ALERT_TARGET` | destination for source freshness alerts | пусто |
| `PAYMENT_WEBHOOK_ALERT_TARGET` | destination for webhook alerts | пусто |
| `COST_ALERTS_CONFIGURED` | marker that infra/API budget alerts are configured | `false` |

Demo identity:

| Переменная | Назначение | Local default |
| --- | --- | --- |
| `DEMO_USER_ID` | fallback user для MVP auth | `demo-user` |
| `DEMO_USER_EMAIL` | fallback email для MVP auth | `demo@domarion.local` |

## Structured logging

Backend пишет request logs в JSON через logger `domarion.request`. Каждая запись содержит
`event`, `service`, `environment`, `request_id`, `method`, `path`, `query`, `status_code`,
`duration_ms`, `client_host` и `user_agent`.

Входящий `X-Request-ID` сохраняется, возвращается в response header и попадает в log payload.
Если header не передан, API генерирует новый request id. Уровень `domarion.*` логов управляется
переменной `LOG_LEVEL`.

## Error tracking

Backend поддерживает optional Sentry integration. Она включается только при заданном `SENTRY_DSN`;
без DSN приложение стартует без внешнего error tracking. Release передается как
`domarion-analytics@<version>`, environment берется из `ENVIRONMENT`, performance traces
управляются через `SENTRY_TRACES_SAMPLE_RATE`.

`send_default_pii` отключен. Дополнительно `before_send` удаляет из Sentry events request
`headers`, `cookies`, `data`, `query_string` и `env`, а URL сохраняет без query string, чтобы
адреса квартир и параметры проверки не уходили во внешний сервис.

Минимум для frontend build:

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Публичный URL backend API |
| `NEXT_PUBLIC_OWNER_ID` | Временный MVP owner fallback |
| `NEXT_PUBLIC_SITE_URL` | Публичный URL frontend для sitemap/canonical URLs |

Для реального production нельзя оставлять demo identity как auth-модель. Перед
публичным запуском нужно заменить header/demo auth на Auth.js/Clerk/custom JWT,
задать live Stripe/PayU credentials и webhook secrets, проверить fulfillment
end-to-end и включать delivery только после настройки SMTP/Telegram secrets.

## Deployment Target

Current hosted environment: Oracle Cloud Infrastructure single-VM Docker Compose
deployment. The deployment is live and working as of 2026-09-01; keep real
domains, IPs, SSH keys and secrets outside git.

OCI setup and operations are documented in `docs/oci_staging_setup_runbook.md`.
The original planning checklist is in `docs/oracle_cloud_deployment_plan.md`.

The previous Render MVP hosting decision is retained in
`docs/mvp_hosting_decision.md` as a fallback/reference path. `render.yaml`
remains in the repo, but it is not the active hosted environment.

`render.yaml` описывает:

- `domarion-postgres`: managed Postgres 18 with PostGIS migration.
- `domarion-redis`: Render Key Value Redis-compatible service.
- `domarion-api`: backend Docker web service with `/ready` health check.
- `domarion-frontend`: Next standalone Docker web service.
- `domarion-worker`: worker process on the same backend image.

Blueprint intentionally leaves secrets and public URLs as `sync: false`. Before
traffic every placeholder must be filled in the hosting dashboard, then verified
with:

```powershell
python -m alembic upgrade head
domarion production-preflight --strict
python scripts\smoke_deployment.py
python scripts\verify_postgres_staging.py --database-url $env:DATABASE_URL
```

## Что еще нужно до production

- Подключить real auth вместо MVP header/demo identity.
- Заполнить production domains, CORS, S3/R2, payment, Sentry and monitoring
  secrets outside git.
- Провести legal review Source Registry entries до scheduled ingestion и paid data use.
- Пройти restore drill: fresh logical backup, restore into empty/staging DB,
  smoke check after restore.
- Проверить live Stripe или PayU checkout, webhook idempotency and fulfillment.
- Включать `ALERT_WORKER_SEND=true` только после SMTP/Telegram deliverability test.
- Держать `/ready` в `ready`; `degraded` допустим только для controlled staging.
