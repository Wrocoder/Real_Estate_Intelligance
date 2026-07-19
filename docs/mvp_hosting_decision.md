# MVP Hosting Decision

Decision date: 2026-07-20

This project is not deployed to production yet. For paid beta preparation, the
selected MVP deployment target is:

- Platform: Render Blueprint in the Frankfurt region.
- Runtime services: `domarion-api`, `domarion-frontend`, `domarion-worker`.
- Managed database: Render Postgres 18 with PostGIS enabled by Alembic migration.
- Managed Redis-compatible store: Render Key Value.
- Object storage: Cloudflare R2 through the existing S3-compatible artifact store.
- Error monitoring: Sentry DSN through env var.
- Readiness gate: `GET /ready` and `domarion production-preflight`.

The repo now includes `render.yaml` as the first production IaC artifact. It is
intentionally not a live deploy: secrets, public domains and payment redirects are
left as `sync: false` placeholders.

## Why Render First

Render is the pragmatic MVP choice because one Blueprint can manage web services,
background workers, a managed Postgres database and Redis-compatible Key Value in
one operational surface. That reduces founder-maintained infrastructure before
the first paid beta.

The current app also maps cleanly to Render:

- FastAPI API Docker service with `/ready` health check.
- Next standalone frontend Docker service.
- Same API image reused as `domarion worker`.
- Managed Postgres supports common extensions, including PostGIS.
- Render Key Value uses Redis-compatible `redis://` and `rediss://` URLs.

## Why Not The Alternatives First

- Cloud Run: strong long-term option, but MVP needs more Google Cloud IAM, Cloud
  SQL, jobs, artifact registry and budget-alert wiring.
- Fly.io: good for distributed services, but requires more hands-on machines,
  volumes and operational ownership.
- Railway: fast for prototypes, but the current priority is a more explicit
  production preflight and ops runbook around paid reports.
- Hetzner VPS: lower infrastructure cost, but self-managed Postgres/PostGIS,
  backups, security patching and worker supervision add too much operational risk
  before demand validation.

Revisit the decision after the first paid beta if usage shows a clear need for
lower infra cost, multi-region deployment, or provider-specific enterprise controls.

## Required Dashboard Values

Before syncing `render.yaml`, populate these values in the Render Dashboard:

- `CORS_ORIGINS`: JSON list with the production frontend origin, for example
  `["https://app.example.com"]`.
- `NEXT_PUBLIC_API_BASE_URL`: production API URL.
- `NEXT_PUBLIC_SITE_URL`: production frontend URL.
- `REPORT_ARTIFACT_S3_ENDPOINT_URL`: Cloudflare R2 endpoint, for example
  `https://<account_id>.r2.cloudflarestorage.com`.
- `REPORT_ARTIFACT_S3_BUCKET`: private report artifact bucket.
- `REPORT_ARTIFACT_S3_ACCESS_KEY_ID` and `REPORT_ARTIFACT_S3_SECRET_ACCESS_KEY`.
- `BACKUP_S3_BUCKET` and `BACKUP_S3_ENDPOINT_URL`.
- `PAYMENT_SUCCESS_URL`, `PAYMENT_CANCEL_URL`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`.
- `SENTRY_DSN`.
- `UPTIME_MONITOR_URL`, `JOB_FAILURE_ALERT_TARGET`,
  `SOURCE_FRESHNESS_ALERT_TARGET`, `PAYMENT_WEBHOOK_ALERT_TARGET`.
- `COST_ALERTS_CONFIGURED=true` only after platform budget alerts are configured.

## First Deploy Checklist

1. Create the Render Blueprint from `render.yaml`.
2. Fill every `sync: false` value.
3. Confirm the Postgres service has PostGIS available.
4. Trigger deploy and let `preDeployCommand` run:
   `python -m alembic upgrade head && domarion production-preflight`.
5. Run staging verifier against the production database before paid traffic:
   `python scripts/verify_postgres_staging.py --database-url $env:DATABASE_URL`.
6. Run smoke:
   `python scripts/smoke_deployment.py`.
7. Run a logical backup dry run, then a real backup to R2.
8. Process one test checkout and webhook event before enabling paid traffic.

## Official References

- Render Blueprints:
  https://render.com/docs/blueprint-spec
- Render infrastructure as code:
  https://render.com/docs/infrastructure-as-code
- Render FastAPI deployment port shape:
  https://render.com/docs/deploy-fastapi
- Render web service port binding:
  https://render.com/docs/web-services
- Render Postgres extensions, including PostGIS:
  https://render.com/docs/postgresql-extensions
- Render Key Value Redis-compatible URLs:
  https://render.com/docs/key-value
- Render Docker env vars as build args:
  https://render.com/docs/docker
- Render secret placeholders in Blueprints:
  https://render.com/docs/configure-environment-variables
- Cloudflare R2 S3-compatible API:
  https://developers.cloudflare.com/r2/api/s3/api/
