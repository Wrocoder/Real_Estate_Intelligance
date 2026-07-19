# Production Ops Runbook

Domarion is not deployed to production yet. This runbook defines the deploy-ready
operational baseline to use before a paid beta: managed Postgres/PostGIS, managed
Redis, offsite backups, report artifact bucket and background workers.

## Service Topology

- API: Docker image from root `Dockerfile`, `uvicorn main:app`.
- Frontend: Docker image from `frontend/Dockerfile`, Next standalone server.
- Worker: same API image, command `domarion worker`.
- Database: managed PostgreSQL with PostGIS enabled.
- Cache/queue foundation: managed Redis.
- Object storage: S3-compatible private bucket for report artifacts and database backups.

Use staging compose locally to verify the same process model:

```powershell
docker compose -f compose.staging.yaml up --build
```

## Managed Postgres/PostGIS

Production must use `DATA_REPOSITORY_BACKEND=postgres` and matching Postgres-backed
stores for reports, users, auth, ingestion admin, drafts, partners, AI insights and
custom dashboards. The database service must support:

- PostgreSQL 16 or newer.
- PostGIS extension.
- TLS connections from API and worker.
- Daily managed backups plus point-in-time recovery if the provider supports it.
- Manual logical backups through `scripts/postgres_backup.py`.

Required env shape:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname?sslmode=require
DATA_REPOSITORY_BACKEND=postgres
REPORT_STORE_BACKEND=postgres
REPORT_ORDER_STORE_BACKEND=postgres
USER_STORE_BACKEND=postgres
AUTH_STORE_BACKEND=postgres
AGENCY_STORE_BACKEND=postgres
CRM_STORE_BACKEND=postgres
INGESTION_ADMIN_STORE_BACKEND=postgres
USER_SUBMITTED_LISTING_STORE_BACKEND=postgres
PARTNER_REFERRAL_STORE_BACKEND=postgres
AI_INSIGHT_STORE_BACKEND=postgres
CUSTOM_DASHBOARD_STORE_BACKEND=postgres
```

Before switching traffic:

```powershell
python -m alembic upgrade head
python scripts/verify_postgres_staging.py --database-url $env:DATABASE_URL
```

## Managed Redis

Redis is required for production deployment parity even while most jobs are still
DB-backed. Use a managed Redis with persistence disabled or minimal persistence for
cache use, TLS if available, and `noeviction`/quota alerts where the provider allows it.

```env
REDIS_URL=redis://user:password@host:6379/0
```

## Backup Strategy

Use provider-managed backups as the first recovery line and logical backups as the
portable escape hatch. Logical backups must be stored outside the database provider.

Create a backup:

```powershell
python scripts/postgres_backup.py backup --database-url $env:DATABASE_URL
```

Create a backup and upload it to S3-compatible storage:

```powershell
$env:BACKUP_S3_BUCKET="domarion-backups"
$env:BACKUP_S3_PREFIX="production/postgres"
$env:BACKUP_S3_ENDPOINT_URL="https://s3.example.com"
python scripts/postgres_backup.py backup --database-url $env:DATABASE_URL
```

Restore into a verified empty/staging database before using it for production:

```powershell
python scripts/postgres_backup.py restore .domarion/backups/postgres/domarion-postgres-YYYYMMDDTHHMMSSZ.dump `
  --database-url $env:RESTORE_DATABASE_URL `
  --clean
```

Minimum policy:

- Local retention: 14 days.
- Offsite retention: 90 days.
- Restore drill: before paid beta, then monthly.
- Never run restore against production without first taking a fresh backup.

## Report Artifact Bucket

Report artifacts already support `REPORT_ARTIFACT_STORAGE_BACKEND=s3`. Production
bucket requirements:

- Private bucket by default.
- Separate prefixes for `production/reports` and `production/postgres-backups`.
- Lifecycle policy for old exports/backups.
- Access key scoped only to the required bucket/prefix.

```env
REPORT_ARTIFACT_STORAGE_BACKEND=s3
REPORT_ARTIFACT_S3_ENDPOINT_URL=https://s3.example.com
REPORT_ARTIFACT_S3_REGION=eu-central-1
REPORT_ARTIFACT_S3_BUCKET=domarion-artifacts
REPORT_ARTIFACT_S3_PREFIX=production/reports
REPORT_ARTIFACT_PUBLIC_BASE_URL=
```

## Worker Deployment

The worker container uses the API image and runs:

```powershell
domarion worker
```

Default task is `daily-email-alerts`. Additional supported tasks can be enabled via
`WORKER_TASKS`:

```env
WORKER_TASKS=daily-email-alerts,area-market-snapshots,price-history-rebuild
WORKER_INTERVAL_SECONDS=3600
ALERT_WORKER_SEND=false
WORKER_APPLY=false
```

For paid beta, keep `ALERT_WORKER_SEND=false` until SMTP/Telegram credentials and
deliverability are verified. Set `WORKER_APPLY=true` only after Postgres backups and
restore drill are complete.

## Readiness And Preflight

The API exposes a deployment readiness report:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/ready
```

`/health` is only a process heartbeat. `/ready` validates production guardrails:
Postgres-backed stores, managed Postgres/Redis URLs, production CORS, S3 report
artifacts, real payment provider configuration, alert transports, worker flags,
offsite backups, monitoring targets and cost-control marker.

Run the same checks from CI/CD before switching traffic:

```powershell
.\.venv\Scripts\domarion.exe production-preflight
.\.venv\Scripts\domarion.exe production-preflight --strict
```

Exit behavior:

- `status=blocked`: command exits with code 1 and `/ready` returns HTTP 503.
- `status=degraded`: command exits with code 0, or code 1 with `--strict`.
- `status=ready`: no failed or warning checks.

Monitoring/cost env markers used by preflight:

```env
UPTIME_MONITOR_URL=https://...
JOB_FAILURE_ALERT_TARGET=ops@example.com
SOURCE_FRESHNESS_ALERT_TARGET=ops@example.com
PAYMENT_WEBHOOK_ALERT_TARGET=ops@example.com
COST_ALERTS_CONFIGURED=true
```

## Remaining Before Production Traffic

- Pick the actual hosting provider and domain.
- Configure production secrets outside git.
- Run Alembic, staging verifier, production preflight, deployment smoke and restore drill.
- Connect the listed monitoring and cost alert targets to the chosen hosting provider.
