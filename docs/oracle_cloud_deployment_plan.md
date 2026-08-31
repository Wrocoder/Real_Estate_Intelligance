# Oracle Cloud Deployment Task List

Status: draft for OCI Always Free migration planning.
Checked against Oracle docs on 2026-08-28.

## Target Shape

Use a single OCI Always Free Arm VM first, not Kubernetes.

- Runtime: Docker Compose on one VM.Standard.A1.Flex instance.
- Suggested free-tier allocation: 2 OCPUs, 12 GB RAM, one boot volume plus one attached block volume.
- Services: PostGIS, Redis, API, worker, frontend, reverse proxy.
- Database: self-managed PostgreSQL/PostGIS container, because this project needs PostGIS and OCI Always Free managed databases are Oracle/MySQL/NoSQL, not PostgreSQL.
- Artifacts/backups: OCI Object Storage or Cloudflare R2 through the existing S3-compatible storage code.
- Public entrypoints: frontend on `https://<domain>`, API on `https://api.<domain>`.

## Free Tier Constraints To Design Around

- Always Free resources do not expire, but limits apply and they are tied to the tenancy home region.
- Current OCI Ampere A1 Always Free allowance is 1,500 OCPU hours and 9,000 GB hours per month, equivalent to 2 OCPUs and 12 GB RAM for Always Free tenancies.
- OCI can reclaim idle Always Free compute instances after sustained low CPU, network and memory utilization.
- Always Free block storage is 200 GB total across boot and block volumes.
- Always Free Object Storage is limited; keep report artifacts and backups under quota or use external S3-compatible storage.
- Always Free Load Balancer is available, but the first deployment can avoid it by using one public VM with Caddy or Nginx.
- Outbound TCP port 25 is blocked by default; use OCI Email Delivery, external SMTP over 587, or Telegram for alert delivery.

## Architecture Tasks

### 1. Account, Region, And Cost Guardrails

- [ ] Create or confirm OCI tenancy and choose the home region carefully.
- [ ] Verify Always Free availability for Ampere A1 in the selected home region.
- [ ] Configure compartments: `domarion-prod`, optional `domarion-staging`.
- [ ] Add budgets, cost alerts, and usage alerts before creating paid-capable resources.
- [ ] Create an emergency teardown checklist for all OCI resources.
- [ ] Decide whether this replaces the Render plan or starts as OCI staging first.

### 2. Network And VM

- [ ] Create VCN, public subnet, internet gateway, route table and security list or NSG.
- [ ] Open only `22`, `80`, and `443` publicly.
- [ ] Keep PostgreSQL and Redis private to the VM/container network.
- [ ] Provision one VM.Standard.A1.Flex VM with Ubuntu or Oracle Linux Arm image.
- [ ] Allocate storage layout: boot volume plus attached block volume for Docker data, Postgres data and backups.
- [ ] Mount the data volume under a stable path, for example `/srv/domarion`.
- [ ] Configure SSH key-only access and disable password login.
- [ ] Add OS firewall rules and unattended security updates.

### 3. Runtime On The VM

- [ ] Install Docker Engine and Docker Compose plugin for arm64.
- [ ] Create a non-root `domarion` deploy user.
- [ ] Create directory layout:
  - `/srv/domarion/app`
  - `/srv/domarion/env`
  - `/srv/domarion/postgres`
  - `/srv/domarion/redis`
  - `/srv/domarion/artifacts`
  - `/srv/domarion/backups`
- [ ] Add log rotation for Docker container logs.
- [ ] Add a systemd unit that runs `docker compose up -d` after reboot.

### 4. Repo Changes

- [x] Add `compose.oracle.yaml` for production-like single-VM deployment.
- [x] Add `.env.oracle.example` with OCI-specific required variables and safe placeholders.
- [x] Add reverse-proxy config, preferably Caddy for automatic TLS.
- [x] Add an arm64-compatible PostGIS Dockerfile for OCI Ampere A1.
- [x] Add a systemd unit template for starting the Compose stack after reboot.
- [x] Add `scripts/deploy_oracle_cloud.ps1` or `scripts/deploy_oracle_cloud.sh`.
- [x] Add `scripts/oracle_cloud_preflight.py` for OCI env/domain/compose guardrails.
- [x] Document exact server bootstrap commands.
- [ ] Keep Render files until OCI deployment is verified end-to-end.

### 5. Images And CI/CD

- [x] Decide image source: build on VM for first bootstrap, then GHCR linux/arm64 images.
- [x] Prefer registry-based deploy after first bootstrap.
- [x] Update GitHub Actions to build and push linux/arm64 images after CI passes.
- [x] Add deploy job gated by manual approval or protected environment.
- [x] Deploy by SSH: pull images, write env file, run migrations, restart services, run smoke checks.
- [x] Keep rollback path: previous image tags and previous `.env` snapshot.

### 6. Secrets And Environment

- [ ] Create production `.env` outside git.
- [ ] Set all store backends to `postgres`.
- [ ] Set `DATABASE_URL` to the internal Postgres service URL.
- [ ] Set `REDIS_URL` to the internal Redis service URL.
- [ ] Set `CORS_ORIGINS` to the production frontend origin.
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` before frontend build.
- [ ] Configure `REPORT_ARTIFACT_STORAGE_BACKEND=s3` with OCI Object Storage or R2.
- [ ] Configure backup S3 bucket, endpoint, access key and prefix.
- [ ] Keep `PAYMENT_PROVIDER=mock` until live checkout is tested intentionally.
- [ ] Keep `ALERT_WORKER_SEND=false` until SMTP or Telegram delivery is verified.

### 7. Database And Persistence

- [ ] Use PostGIS image compatible with the current Alembic migrations.
- [ ] Store Postgres data on the attached volume, not on the VM root filesystem if possible.
- [ ] Run `python -m alembic upgrade head` before first API start.
- [ ] Run `python scripts/verify_postgres_staging.py --database-url $DATABASE_URL`.
- [ ] Decide whether demo seed is allowed in OCI staging and forbidden in production.
- [ ] Configure Postgres memory settings conservatively for 12 GB RAM.
- [ ] Define manual DB maintenance commands: backup, restore, vacuum/analyze, disk usage.

### 8. Backups And Restore

- [ ] Run `scripts/postgres_backup.py backup` locally on the VM.
- [ ] Upload logical backups to S3-compatible storage.
- [ ] Set retention policy for local and offsite backups.
- [ ] Run restore drill into an empty test database before paid traffic.
- [ ] Add backup health check to monitoring.
- [ ] Keep DB and artifact backup prefixes separate.

### 9. Domain, TLS, And Routing

- [ ] Buy or choose domain.
- [ ] Point DNS records to the VM public IP.
- [ ] Terminate TLS at Caddy or Nginx.
- [ ] Route `/` to frontend and API hostname to backend.
- [ ] Confirm Next.js frontend was built with final public URLs.
- [ ] Verify `/health`, `/ready`, sitemap and canonical URLs.

### 10. Observability And Operations

- [ ] Configure Sentry DSN for backend.
- [ ] Configure uptime monitor for frontend and API readiness.
- [ ] Configure job failure, source freshness and payment webhook alert targets.
- [ ] Enable OCI Monitoring alarms for CPU, memory, disk, network and instance state.
- [ ] Enable cost alert marker only after real budget alarms exist: `COST_ALERTS_CONFIGURED=true`.
- [ ] Define monthly restore drill and dependency patch cadence.

### 11. Security

- [ ] Keep SSH private key out of repo and CI logs.
- [ ] Restrict GitHub deploy key or token permissions.
- [ ] Keep Postgres and Redis off the public internet.
- [ ] Use strong generated Postgres password.
- [ ] Verify containers do not run as root where practical.
- [ ] Patch OS and images regularly.
- [ ] Add fail2ban or equivalent SSH brute-force protection.
- [ ] Review source registry and data retention policy before scheduled ingestion.

### 12. Release Gate

- [ ] CI green on `main`.
- [ ] `docker compose -f compose.oracle.yaml config` passes.
- [ ] Fresh VM bootstrap completed from documented commands.
- [ ] Alembic migrations pass.
- [ ] `domarion production-preflight --strict` passes or documented warnings are accepted for OCI staging only.
- [ ] `python scripts/smoke_deployment.py` passes against public URLs.
- [ ] Backup and restore drill passes.
- [ ] Payment test checkout and webhook pass before paid beta.
- [ ] Worker dry-run passes before enabling live delivery.

## Suggested Milestones

### Milestone A: OCI Staging On One VM

- Create VM and network.
- Add `compose.oracle.yaml`.
- Deploy with `PAYMENT_PROVIDER=mock`, `ALERT_WORKER_SEND=false`.
- Run migrations, smoke checks and restore drill.

## First VM Bootstrap

Run these commands on the OCI VM after DNS points to the VM public IP and ports
`80` and `443` are open in the OCI network rules.

```bash
sudo mkdir -p /srv/domarion/{app,env,postgres,redis,artifacts/reports,backups/postgres,caddy/data,caddy/config}
sudo chown -R "$USER:$USER" /srv/domarion

git clone git@github.com:Wrocoder/Real_Estate_Intelligance.git /srv/domarion/app
cd /srv/domarion/app

cp .env.oracle.example /srv/domarion/env/oracle.env
chmod 600 /srv/domarion/env/oracle.env
```

Edit `/srv/domarion/env/oracle.env` before starting the stack:

- replace `app.example.com` and `api.example.com`;
- replace `POSTGRES_PASSWORD` and make `DATABASE_URL` match it;
- keep `ENVIRONMENT=staging` for the first OCI smoke deploy;
- keep `PAYMENT_PROVIDER=mock` and `ALERT_WORKER_SEND=false` until paid-beta release gates pass.

Run the OCI-specific preflight before the first deploy:

```bash
python3 scripts/oracle_cloud_preflight.py --env-file /srv/domarion/env/oracle.env --compose-file compose.oracle.yaml
```

Start the first staging stack with demo seed:

```bash
scripts/deploy_oracle_cloud.sh --seed
```

After the first seed is complete, normal restarts should omit the `seed` profile:

```bash
scripts/deploy_oracle_cloud.sh
```

After GHCR publishing is enabled, set registry image tags in
`/srv/domarion/env/oracle.env`:

```bash
API_IMAGE=ghcr.io/<owner>/domarion-api:sha-<commit>
FRONTEND_IMAGE=ghcr.io/<owner>/domarion-frontend:sha-<commit>
POSTGIS_IMAGE=ghcr.io/<owner>/domarion-postgis:sha-<commit>
```

Then deploy by pulling the published arm64 images:

```bash
scripts/deploy_oracle_cloud.sh --pull-images
```

Install the systemd unit after the manual run is healthy:

```bash
sudo cp deploy/oracle/domarion-compose.service /etc/systemd/system/domarion-compose.service
sudo systemctl daemon-reload
sudo systemctl enable domarion-compose
sudo systemctl start domarion-compose
```

Run public smoke checks from a workstation:

```powershell
$env:API_BASE_URL = "https://api.example.com"
$env:FRONTEND_BASE_URL = "https://app.example.com"
python scripts\smoke_deployment.py
```

### Milestone B: Production Candidate

- Add domain and TLS.
- Add registry-based deploy.
- Add backups to S3-compatible storage.
- Add monitoring and cost alerts.
- Make `/ready` pass in strict mode or document remaining launch blockers.

### Milestone C: Paid Beta Cutover

- Configure live payment provider and webhook secret.
- Verify report artifact storage.
- Verify email or Telegram delivery.
- Freeze rollback procedure.
- Switch traffic only after backup, restore and smoke checks pass.

## Official Oracle References

- OCI Free Tier:
  https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- OCI Always Free resources:
  https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Oracle Cloud Free Tier overview:
  https://www.oracle.com/cloud/free/
- Always Free Autonomous AI Database limits:
  https://docs.oracle.com/en/cloud/paas/autonomous-database/serverless/adbsb/autonomous-always-free.html
