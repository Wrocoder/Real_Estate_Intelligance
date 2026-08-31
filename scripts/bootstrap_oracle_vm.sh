#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DOMARION_DEPLOY_USER:-domarion}"
DATA_DIR="${DOMARION_DATA_DIR:-/srv/domarion}"
HARDEN_SSH=0

usage() {
  cat <<'EOF'
Usage: sudo scripts/bootstrap_oracle_vm.sh [--harden-ssh]

Environment:
  DOMARION_DEPLOY_USER  default domarion
  DOMARION_DATA_DIR     default /srv/domarion

Options:
  --harden-ssh  Disable SSH password auth after sshd config validation.
EOF
}

while (($#)); do
  case "$1" in
    --harden-ssh)
      HARDEN_SSH=1
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

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this bootstrap script with sudo/root on the OCI VM." >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This bootstrap script expects an Ubuntu/Debian OCI image with apt-get." >&2
  exit 1
fi

apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fail2ban \
  git \
  gnupg \
  unattended-upgrades \
  ufw

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

. /etc/os-release
architecture="$(dpkg --print-architecture)"
cat > /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=${architecture} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable
EOF

apt-get update
apt-get install -y --no-install-recommends \
  containerd.io \
  docker-buildx-plugin \
  docker-ce \
  docker-ce-cli \
  docker-compose-plugin

systemctl enable --now docker
systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades

if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$DATA_DIR/app" \
  "$DATA_DIR/env" \
  "$DATA_DIR/postgres" \
  "$DATA_DIR/redis" \
  "$DATA_DIR/artifacts/reports" \
  "$DATA_DIR/backups/postgres" \
  "$DATA_DIR/caddy/data" \
  "$DATA_DIR/caddy/config"

if [[ ! -f /etc/docker/daemon.json ]]; then
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
EOF
  systemctl restart docker
else
  echo "/etc/docker/daemon.json already exists; review Docker log rotation manually." >&2
fi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [[ "$HARDEN_SSH" -eq 1 ]]; then
  install -d /etc/ssh/sshd_config.d
  cat > /etc/ssh/sshd_config.d/99-domarion-hardening.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
EOF
  sshd -t
  systemctl reload ssh || systemctl reload sshd
fi

echo "OCI VM bootstrap complete. Re-login before using Docker as ${DEPLOY_USER}."
