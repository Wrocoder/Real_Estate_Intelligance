#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${DOMARION_APP_DIR:-/srv/domarion/app}"
ENV_FILE="${DOMARION_ENV_FILE:-/srv/domarion/env/oracle.env}"
COMPOSE_FILE="${DOMARION_COMPOSE_FILE:-compose.oracle.yaml}"
LOCK_FILE="${DOMARION_RCN_LOCK_FILE:-/srv/domarion/data/rcn-daily.lock}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Application checkout is missing: $APP_DIR" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file is missing: $ENV_FILE" >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for the RCN daily job." >&2
  exit 1
fi

mkdir -p "$(dirname "$LOCK_FILE")"
cd "$APP_DIR"

set +e
/usr/bin/flock -n -E 75 "$LOCK_FILE" \
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  run --rm --no-deps worker \
  domarion worker --task rcn-transactions --run-once --apply
status=$?
set -e

if [[ "$status" -eq 75 ]]; then
  echo "RCN daily job is already running; skipping overlapping invocation."
  exit 0
fi
exit "$status"
