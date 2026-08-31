#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${DOMARION_APP_DIR:-/srv/domarion/app}"
ENV_FILE="${DOMARION_ENV_FILE:-/srv/domarion/env/oracle.env}"
COMPOSE_FILE="${DOMARION_COMPOSE_FILE:-compose.oracle.yaml}"
BRANCH="${DOMARION_BRANCH:-main}"
RUN_SEED=0
SKIP_GIT_PULL=0
SKIP_SMOKE=0
PULL_IMAGES="${DOMARION_PULL_IMAGES:-0}"

usage() {
  cat <<'EOF'
Usage: scripts/deploy_oracle_cloud.sh [--seed] [--pull-images] [--skip-git-pull] [--skip-smoke]

Environment:
  DOMARION_APP_DIR       default /srv/domarion/app
  DOMARION_ENV_FILE      default /srv/domarion/env/oracle.env
  DOMARION_COMPOSE_FILE  default compose.oracle.yaml
  DOMARION_BRANCH        default main
  DOMARION_PULL_IMAGES   set to 1/true to pull registry images instead of building

Options:
  --seed           Run the demo seed service after migrations.
  --pull-images    Pull registry images instead of building on the VM.
  --skip-git-pull  Deploy the currently checked out source.
  --skip-smoke     Skip in-container health checks after startup.
EOF
}

while (($#)); do
  case "$1" in
    --seed)
      RUN_SEED=1
      ;;
    --pull-images)
      PULL_IMAGES=1
      ;;
    --skip-git-pull)
      SKIP_GIT_PULL=1
      ;;
    --skip-smoke)
      SKIP_SMOKE=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Application checkout is missing: $APP_DIR" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file is missing: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

if [[ "$SKIP_GIT_PULL" -eq 0 ]]; then
  git fetch --prune origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

python3 scripts/oracle_cloud_preflight.py --env-file "$ENV_FILE" --compose-file "$COMPOSE_FILE"
compose config >/dev/null
if [[ "$PULL_IMAGES" == "1" || "$PULL_IMAGES" == "true" ]]; then
  compose pull db redis api frontend caddy
else
  compose build db api frontend
fi
compose up -d db redis
compose up --no-deps --force-recreate --abort-on-container-exit --exit-code-from migrate migrate

if [[ "$RUN_SEED" -eq 1 ]]; then
  compose --profile seed up --no-deps --force-recreate --abort-on-container-exit --exit-code-from seed seed
fi

compose up -d --remove-orphans api frontend worker caddy

if [[ "$SKIP_SMOKE" -eq 0 ]]; then
  compose exec -T api python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5).read()"
  compose exec -T api domarion production-preflight
  compose exec -T frontend node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
fi

compose ps
