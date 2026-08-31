# OCI Staging Setup Runbook

Цель: поднять первый staging на одной OCI Ampere A1 VM после push в `main`.
В репозиторий не добавляются реальные secrets, домены, SSH keys или tokens.

## 1. GitHub Environment

Создай GitHub Environment `oci-staging` и включи manual approval перед deploy.

Repository variables:

- `OCI_NEXT_PUBLIC_API_BASE_URL`: public API URL, for example `https://api.example.com`.
- `OCI_NEXT_PUBLIC_SITE_URL`: public frontend URL, for example `https://app.example.com`.
- `OCI_NEXT_PUBLIC_OWNER_ID`: optional, default `demo-user`.
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

## 5. Rollback

Rollback is manual until staging proves stable.

1. Restore the previous `/srv/domarion/env/snapshots/oracle.env.<timestamp>` to
   `/srv/domarion/env/oracle.env`.
2. Set `API_IMAGE`, `FRONTEND_IMAGE` and `POSTGIS_IMAGE` to the previous
   `sha-<commit>` tags if needed.
3. Run `scripts/deploy_oracle_cloud.sh --pull-images`.
4. Run public smoke checks again.
