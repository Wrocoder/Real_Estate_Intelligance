# OCI Staging Setup Runbook

Status: active Oracle Cloud deployment, verified working on 2026-09-01.

Цель: поддерживать single-VM Oracle Cloud deployment на OCI Ampere A1 после push
в `main`. В репозиторий не добавляются реальные secrets, домены, IP, SSH keys
или tokens.

## 0. Current Deployment Record

Keep the real deployment values in the password manager or Oracle/GitHub
dashboards, not in git.

- Cloud: Oracle Cloud Infrastructure.
- Runtime: Docker Compose on one VM.
- App path: `/srv/domarion/app`.
- Env file: `/srv/domarion/env/oracle.env`.
- Compose file: `compose.oracle.yaml`.
- Public frontend URL: store outside git.
- Public API URL: store outside git.
- Deploy source: GHCR linux/arm64 images or VM-local image build.
- Systemd stack unit: `domarion-compose.service`.
- Backup timer: `domarion-postgres-backup.timer`.

Daily operations on the VM:

```bash
cd /srv/domarion/app
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml ps
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml logs --tail=200 api
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml logs --tail=200 frontend
sudo journalctl -u domarion-compose.service -n 100 --no-pager
sudo journalctl -u domarion-postgres-backup.service -n 100 --no-pager
```

Health checks from a workstation:

```powershell
$env:API_BASE_URL = "https://api.example.com"
$env:FRONTEND_BASE_URL = "https://app.example.com"
python scripts\smoke_deployment.py
```

Use the real URLs from the deployment record before running the smoke script.

## 1. GitHub Environment

Создай GitHub Environment `oci-staging` и включи manual approval перед deploy.

Repository variables:

- `OCI_NEXT_PUBLIC_API_BASE_URL`: public API URL, for example `https://api.example.com`.
- `OCI_NEXT_PUBLIC_SITE_URL`: public frontend URL, for example `https://app.example.com`.
- `OCI_DEPLOY_USER`: optional, default `domarion`.
- `OCI_DEPLOY_PORT`: optional, default `22`.
- `OCI_IMAGE_PUBLISH_ENABLED`: set to `true` only when automatic image publish on
  every `main` push is intentional.

Environment or repository secrets:

- `OCI_DEPLOY_HOST`: VM public hostname or IP.
- `OCI_SSH_PRIVATE_KEY`: private deploy key used only for this environment.
- `OCI_SSH_KNOWN_HOSTS`: pinned SSH host key line from `ssh-keyscan`.
- `OCI_ENV_FILE`: full contents of `/srv/domarion/env/oracle.env`.
- `OCI_GHCR_USERNAME`: optional, required only for private GHCR packages.
- `OCI_GHCR_READ_TOKEN`: optional, required only for private GHCR packages.

`OCI_ENV_FILE` must contain a unique `AUTH_SESSION_SECRET` with at least 32 random
characters. Do not reuse the example value or expose it as a frontend variable.

## 2. OCI VM Bootstrap

Create one Ubuntu Arm VM with public `22`, `80` and `443`; keep Postgres and
Redis inside Docker networking only.

On the VM:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone git@github.com:Wrocoder/Real_Estate_Intelligance.git ~/domarion-bootstrap
cd ~/domarion-bootstrap
sudo scripts/bootstrap_oracle_vm.sh
```

After key-based SSH works for the deploy user, rerun hardening intentionally:

```bash
sudo scripts/bootstrap_oracle_vm.sh --harden-ssh
```

Clone the deploy checkout:

```bash
sudo -u domarion git clone git@github.com:Wrocoder/Real_Estate_Intelligance.git /srv/domarion/app
cd /srv/domarion/app
sudo -u domarion cp .env.oracle.example /srv/domarion/env/oracle.env
sudo chmod 600 /srv/domarion/env/oracle.env
```

Edit `/srv/domarion/env/oracle.env` with real staging values and run:

```bash
python3 scripts/oracle_cloud_preflight.py --env-file /srv/domarion/env/oracle.env --compose-file compose.oracle.yaml
scripts/deploy_oracle_cloud.sh --seed
```

## 3. GitHub Publish And Deploy

Manual publish only:

1. Open GitHub Actions `CI`.
2. Run workflow on `main`.
3. Set `publish_images=true`.
4. Set `deploy_oci=false`.

Manual deploy:

1. Open GitHub Actions `CI`.
2. Run workflow on `main`.
3. Set `deploy_oci=true`.
4. Approve the `oci-staging` Environment deployment.

The deploy job publishes `sha-<commit>` arm64 images, writes the remote env file,
stores the previous remote env under `/srv/domarion/env/snapshots`, pulls images
and runs migrations plus smoke checks through `scripts/deploy_oracle_cloud.sh`.

## 4. Post-Deploy Checks

From a workstation:

```powershell
$env:API_BASE_URL = "https://api.example.com"
$env:FRONTEND_BASE_URL = "https://app.example.com"
python scripts\smoke_deployment.py
```

On the VM:

```bash
cd /srv/domarion/app
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml ps
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml exec -T api domarion production-preflight
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api python scripts/postgres_backup.py backup
sudo systemctl start domarion-postgres-backup.service
sudo journalctl -u domarion-postgres-backup.service -n 100 --no-pager
```

After every deploy, record the deployed commit SHA, image tags and smoke result
outside git. If `/ready` is `degraded`, capture the warning list and decide
whether it is acceptable for staging; do not treat `blocked` as healthy.

## 4a. Approved Market Feed

The live Wrocław listing worker is opt-in. Before enabling it, create the source
registry entry with `legal_status=approved`, `is_demo=false`, an authorized feed
method, market/report allowed use, retention and Terms/licence notes. Then set
these values in `/srv/domarion/env/oracle.env`:

```bash
# Keep rcn-transactions out of WORKER_TASKS: the dedicated cron job below owns
# the once-daily RCN refresh at 08:00 Europe/Warsaw.
WORKER_TASKS=daily-email-alerts,area-market-snapshots,price-history-rebuild,authorized-market-feed
WORKER_APPLY=true
MARKET_DATA_FEED_LOCATION=https://approved-provider.example/wroclaw/listings.json
MARKET_DATA_FEED_SOURCE_NAME=Approved Wroclaw Partner
MARKET_DATA_FEED_COMPLETE_SNAPSHOT=false
MARKET_DATA_FEED_MAX_LISTINGS=10000
MARKET_DATA_FEED_TIMEOUT_SECONDS=20

# Optional official RCN/GUGiK transaction import. Keep disabled until the
# source registry entry is approved and the bbox-scoped WFS URL is tested.
RCN_TRANSACTIONS_LOCATION=https://mapy.geoportal.gov.pl/wss/service/rcn?service=WFS&version=2.0.0&request=GetFeature&typeNames=ms%3Alokale&outputFormat=GML3&count=1000&BBOX=<wroclaw-bbox>,EPSG%3A2180
# Must exactly match the approved Source Registry entry in PostgreSQL.
RCN_TRANSACTIONS_SOURCE_NAME=RCN GUGiK
RCN_TRANSACTIONS_MAX_ROWS=100000
RCN_TRANSACTIONS_MAX_PAGES=500
RCN_TRANSACTIONS_TIMEOUT_SECONDS=30
RCN_TRANSACTIONS_INTERVAL_SECONDS=86400

# Download the official Wrocław osiedle boundary ZIP to the VM first.
# The worker mounts this host directory read-only into /srv/domarion/data.
# Run as the VM administrator, for example:
# sudo mkdir -p /srv/domarion/data
# sudo curl -fL https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip -o /srv/domarion/data/granice-osiedli.zip
# sudo chown -R domarion:domarion /srv/domarion/data
# The container runs as a non-root app user; this public boundary file must be
# readable through the read-only bind mount.
# sudo chmod 644 /srv/domarion/data/granice-osiedli.zip
RCN_DISTRICT_BOUNDARIES_LOCATION=/srv/domarion/data/granice-osiedli.zip
RCN_DISTRICT_BOUNDARIES_SOURCE_NAME=Wrocław Geoportal osiedle boundaries
RCN_DISTRICT_BOUNDARIES_SOURCE_URL=https://geoportal.wroclaw.pl/www/pliki/osiedla/granice-osiedli.zip
RCN_DISTRICT_BOUNDARIES_SOURCE_CRS=2177

# Optional operator notification after a successful RCN refresh.
ALERT_TELEGRAM_ENABLED=true
ALERT_TELEGRAM_BOT_TOKEN=<bot-token>
RCN_TRANSACTIONS_TELEGRAM_CHAT_ID=<chat-id>
```

Install the daily Oracle staging schedule as an administrator. Use `sudoedit`
to create `/etc/cron.d/domarion-rcn-daily` with exactly:

```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
CRON_TZ=Europe/Warsaw
0 8 * * * domarion /srv/domarion/app/scripts/run_rcn_daily_oracle.sh >> /srv/domarion/data/rcn-daily.log 2>&1
```

Then apply permissions and verify the schedule:

```bash
sudo chmod 644 /etc/cron.d/domarion-rcn-daily
sudo chown root:root /etc/cron.d/domarion-rcn-daily
sudo chmod 750 /srv/domarion/app/scripts/run_rcn_daily_oracle.sh
sudo chown domarion:domarion /srv/domarion/app/scripts/run_rcn_daily_oracle.sh
sudo systemctl restart cron
sudo runuser -u domarion -- /srv/domarion/app/scripts/run_rcn_daily_oracle.sh
tail -n 100 /srv/domarion/data/rcn-daily.log
```

The manual run uses the same one-shot path and is useful for validating the
Telegram credentials before waiting for 08:00. The cron entry must run as a
user that can access the Docker socket; add `domarion` to the `docker` group
only if the VM setup has not already done so.

Run a dry validation before enabling writes:

```bash
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api \
  domarion import-authorized-feed "$MARKET_DATA_FEED_LOCATION" \
  --source-name "$MARKET_DATA_FEED_SOURCE_NAME" --dry-run
```

For RCN, use the separate transaction command. The source registry must have
`source_type=transaction_register`, `legal_status=approved`,
`ingestion_method=rcn_wfs`, `is_demo=false` and market-report usage enabled:

```bash
domarion import-rcn-transactions "$RCN_TRANSACTIONS_LOCATION" \
  --source-name "$RCN_TRANSACTIONS_SOURCE_NAME" --dry-run
```

The command stores transaction observations separately from listing snapshots.
It uses the `ms:lokale` GML fields exposed by the official RCN WFS and does not
infer a district when the source only provides city/address and EPSG:2180
geometry.

The worker refuses unregistered, unapproved, inactive or demo sources. It does
not crawl Otodom/OLX HTML pages, bypass access controls or follow arbitrary
pagination links. Use an approved provider API/export instead. After the first
successful run inspect ingestion jobs, quality logs, source freshness and the
Check Apartment flow before setting `MARKET_DATA_FEED_COMPLETE_SNAPSHOT=true`.

## 5. Routine Updates

Use GitHub Actions deploy for the normal path:

1. Push to `main` and wait for CI.
2. Run workflow with `deploy_oci=true`.
3. Approve the `oci-staging` Environment deployment.
4. Confirm the remote command completed with `scripts/deploy_oracle_cloud.sh --pull-images`.
5. Run public smoke checks.

Manual update on the VM:

```bash
cd /srv/domarion/app
git pull --ff-only
python3 scripts/oracle_cloud_preflight.py --env-file /srv/domarion/env/oracle.env --compose-file compose.oracle.yaml
scripts/deploy_oracle_cloud.sh --pull-images
```

For emergency restart without changing code or images:

```bash
sudo systemctl restart domarion-compose.service
docker compose --env-file /srv/domarion/env/oracle.env -f /srv/domarion/app/compose.oracle.yaml ps
```

## 6. Backup And Restore

Backups run through the systemd timer once installed:

```bash
sudo systemctl status domarion-postgres-backup.timer --no-pager
sudo systemctl start domarion-postgres-backup.service
sudo journalctl -u domarion-postgres-backup.service -n 100 --no-pager
```

Manual backup:

```bash
cd /srv/domarion/app
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api python scripts/postgres_backup.py backup
```

If the backup directory is owned by the deploy user, run the manual backup with
the host deploy UID/GID:

```bash
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps --user "$(id -u):$(id -g)" api python scripts/postgres_backup.py backup
```

Restore only into an empty/staging database unless a fresh production backup was
taken and the target was explicitly confirmed:

```bash
docker compose --env-file /srv/domarion/env/oracle.env -f compose.oracle.yaml run --rm --no-deps api python scripts/postgres_backup.py restore /srv/domarion/backups/postgres/domarion-postgres-YYYYMMDDTHHMMSSZ.dump --database-url "$RESTORE_DATABASE_URL" --clean
```

## 7. Rollback

Rollback is manual.

1. Restore the previous `/srv/domarion/env/snapshots/oracle.env.<timestamp>` to
   `/srv/domarion/env/oracle.env`.
2. Set `API_IMAGE`, `FRONTEND_IMAGE` and `POSTGIS_IMAGE` to the previous
   `sha-<commit>` tags if needed.
3. Run `scripts/deploy_oracle_cloud.sh --pull-images`.
4. Run public smoke checks again.
