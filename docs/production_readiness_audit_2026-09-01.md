# Production Readiness Audit - 2026-09-01

Status: Oracle Cloud deployment is live and working, but paid production is not
ready until the blockers below are closed.

Scope: repository and runbook audit. This audit does not include direct access to
the Oracle VM, real domains, real env file values, payment dashboards or external
monitoring dashboards.

## Executive Verdict

Ready for:

- Internal live demo.
- Founder-operated closed staging.
- Manual buyer/realtor demos where payment and auth are controlled.

Not ready for:

- Public self-serve paid traffic.
- Live Stripe/PayU collection from strangers.
- Promising recoverability until backup and restore are proven.

Potentially ready for a small private paid beta after:

- backup timer is running and one restore drill passes;
- uptime, job failure, source freshness, payment webhook and cost alerts exist;
- Stripe or PayU test checkout plus webhook fulfillment passes end-to-end;
- access is controlled by real auth or a deliberately closed manual process.

## What Is Already In Good Shape

- OCI single-VM topology exists in `compose.oracle.yaml`: PostGIS, Redis, API,
  worker, frontend and Caddy.
- Postgres and Redis are not exposed publicly by compose; Caddy is the public
  entrypoint on ports `80` and `443`.
- Alembic migrations run before API/frontend/worker startup.
- All persistent stores default to Postgres in `.env.oracle.example` and
  `compose.oracle.yaml`.
- `scripts/oracle_cloud_preflight.py` blocks placeholder domains, weak Postgres
  password, bad internal service URLs, bad public URLs, invalid CORS and unknown
  worker tasks.
- `scripts/deploy_oracle_cloud.sh` supports VM-local builds, GHCR image pulls,
  migrations, optional seed, in-container smoke checks and `compose ps`.
- GitHub Actions can publish linux/arm64 images and deploy through a protected
  `oci-staging` environment.
- Systemd templates exist for the app stack and logical Postgres backup timer.
- Payment code supports mock, Stripe and PayU checkout plus webhook signature
  verification and idempotent fulfillment tests.
- `/ready` and `domarion production-preflight` exist and cover persistent stores,
  DB/Redis, CORS, artifacts, payments, workers, backups, monitoring and cost
  controls.

## Paid-Beta Blockers

### P0. Backup And Restore Are Not Proven

Evidence in repo:

- Backup script and systemd timer exist.
- `.env.oracle.example` leaves `BACKUP_S3_BUCKET` empty.
- Runbook now documents backup and restore commands.

Required before paid traffic:

- Run a manual logical backup on the VM.
- Confirm `domarion-postgres-backup.timer` is enabled and produces fresh backups.
- Configure offsite S3-compatible backup storage.
- Restore the latest backup into an empty test database.
- Run smoke checks against the restored database.

VM commands:

```bash
cd /srv/domarion/app
sudo systemctl status domarion-postgres-backup.timer --no-pager
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api python scripts/postgres_backup.py backup
ls -lh /srv/domarion/backups/postgres
sudo journalctl -u domarion-postgres-backup.service -n 100 --no-pager
```

If the manual backup hits a bind-mount write permission error, run it with the
host deploy UID/GID:

```bash
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps --user "$(id -u):$(id -g)" api python scripts/postgres_backup.py backup
```

Restore drill command:

```bash
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api python scripts/postgres_backup.py restore /srv/domarion/backups/postgres/domarion-postgres-YYYYMMDDTHHMMSSZ.dump --database-url "$RESTORE_DATABASE_URL" --clean
```

### P0. Public Auth Is Still MVP/Header-Based

Evidence in repo:

- `domarion/auth.py` accepts `owner_id` query fallback and
  `X-Domarion-User-Id`, `X-Domarion-Email`, `X-Domarion-Role`,
  `X-Domarion-Plan` headers.
- Defaults still include `DEMO_USER_ID=demo-user`.

Required before public self-serve:

- Add real identity verification: Auth.js, Clerk, custom JWT, or another chosen
  provider.
- Stop trusting user-controlled plan/role headers at the public edge.
- Keep admin and agency endpoints behind verified roles.
- Decide whether first paid beta is manually provisioned and invite-only. If yes,
  document the temporary control and do not call it public self-serve.

### P0. Live Payment Flow Is Not Production-Proven

Evidence in repo:

- `.env.oracle.example` uses `PAYMENT_PROVIDER=mock`.
- Stripe and PayU adapters and webhook verification tests exist.

Required before collecting real money:

- Choose Stripe or PayU for the first paid beta.
- Configure test-mode credentials and webhook secret outside git.
- Run hosted checkout from the live frontend.
- Confirm webhook fulfillment creates the paid report and audit trail exactly
  once.
- Only then switch to live credentials.

Suggested test sequence:

```powershell
$env:API_BASE_URL = "https://api.example.com"
$env:FRONTEND_BASE_URL = "https://app.example.com"
python scripts\smoke_deployment.py
```

Then create one checkout in the UI and verify the corresponding webhook event in
the API/order audit trail.

### P0. Monitoring And Cost Alerts Are Not Proven

Evidence in repo:

- Production readiness expects `UPTIME_MONITOR_URL`,
  `JOB_FAILURE_ALERT_TARGET`, `SOURCE_FRESHNESS_ALERT_TARGET`,
  `PAYMENT_WEBHOOK_ALERT_TARGET`, `SENTRY_DSN` and
  `COST_ALERTS_CONFIGURED=true`.
- `.env.oracle.example` leaves these empty or false.

Required before paid traffic:

- Uptime probe for frontend.
- Readiness probe for API `/ready`.
- Sentry or equivalent error tracking for backend.
- Alert target for worker/job failures.
- Alert target for source freshness failures.
- Alert target for payment webhook failures.
- OCI budget alarms and cost guardrails.

### P0. Report Artifacts Are Local In OCI Staging

Evidence in repo:

- `.env.oracle.example` sets `REPORT_ARTIFACT_STORAGE_BACKEND=local`.
- Production readiness requires `REPORT_ARTIFACT_STORAGE_BACKEND=s3` for
  production.

Required before paid reports at scale:

- Create private S3-compatible storage using OCI Object Storage or Cloudflare R2.
- Set report artifact bucket, endpoint, region, prefix and credentials outside
  git.
- Generate one paid report and confirm HTML/JSON/PDF artifact persistence.

### P1. Production Preflight Needs An OCI Decision

Evidence in repo:

- `domarion production-preflight` is strictest when `ENVIRONMENT=production`.
- The current OCI shape uses internal container URLs:
  `DATABASE_URL=...@db:5432/...` and `REDIS_URL=redis://redis:6379/0`.
- Production readiness warns when DB/Redis transport does not use TLS.

Decision needed:

- If OCI remains single-VM self-managed production, either document these warnings
  as accepted internal-network exceptions, or update production readiness to
  recognize this OCI topology explicitly.
- If the target becomes managed DB/Redis later, use TLS endpoints and keep
  `--strict` as the release gate.

### P1. Worker Write/Send Flags Are Still Conservative

Evidence in repo:

- `.env.oracle.example` sets `WORKER_APPLY=false` and `ALERT_WORKER_SEND=false`.

Required before live alert workflows:

- Keep dry-run for demo.
- Enable `WORKER_APPLY=true` only after backup and restore are proven.
- Enable `ALERT_WORKER_SEND=true` only after SMTP or Telegram delivery is tested.

### P1. Legal/Data Source Gate Remains Product-Critical

Evidence in repo:

- Source compliance policy exists.
- User-submitted URL flow avoids mass scraping and strips sensitive/raw portal
  data.

Required before selling reports broadly:

- Review Source Registry entries and allowed fields.
- Confirm partner/import permissions.
- Keep confidence/disclaimer language visible where data is estimated or
  unverified.

## Commands To Run Now

On the VM:

```bash
cd /srv/domarion/app
git rev-parse --short HEAD
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml ps
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml exec -T api domarion production-preflight
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml logs --tail=200 api
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml logs --tail=200 worker
df -h /srv/domarion
du -sh /srv/domarion/postgres /srv/domarion/backups/postgres /srv/domarion/artifacts/reports
```

From a workstation:

```powershell
$env:API_BASE_URL = "https://api.example.com"
$env:FRONTEND_BASE_URL = "https://app.example.com"
python scripts\smoke_deployment.py
```

Replace example URLs with the real deployment URLs from the private deployment
record.

## Paid-Beta Release Gate

Use this as the minimum go/no-go checklist.

- Public smoke passes from outside the VM.
- `/ready` is not `blocked`.
- Latest logical backup is fresh.
- Offsite backup upload works.
- Restore drill passed into an empty database.
- Frontend and API uptime monitors are active.
- Worker/job, source freshness and payment webhook alert targets are active.
- OCI budget/cost alerts are active.
- Payment provider is Stripe or PayU in test mode and checkout/webhook flow has
  been verified end-to-end.
- Auth is real, or the beta is explicitly invite-only and manually controlled.
- Report artifacts use S3-compatible storage, or the beta is explicitly limited
  to manual/local artifact handling.
- Source/legal review is complete for the datasets used in paid reports.

## Recommended Next Order

1. Run the VM commands above and save the output outside git.
2. Close backup/restore first.
3. Add uptime/Sentry/cost alerts.
4. Decide the auth path for first users.
5. Test Stripe or PayU in test mode.
6. Switch only a small, controlled beta cohort onto paid reports.
