#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

REQUIRED_ENV_KEYS = (
    "DOMARION_FRONTEND_DOMAIN",
    "DOMARION_API_DOMAIN",
    "DOMARION_DATA_DIR",
    "POSTGRES_PASSWORD",
    "DATABASE_URL",
    "REDIS_URL",
    "CORS_ORIGINS",
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "PAYMENT_PROVIDER",
    "ALERT_WORKER_SEND",
)

POSTGRES_BACKEND_KEYS = (
    "DATA_REPOSITORY_BACKEND",
    "REPORT_STORE_BACKEND",
    "REPORT_ORDER_STORE_BACKEND",
    "USER_STORE_BACKEND",
    "AUTH_STORE_BACKEND",
    "AGENCY_STORE_BACKEND",
    "CRM_STORE_BACKEND",
    "INGESTION_ADMIN_STORE_BACKEND",
    "USER_SUBMITTED_LISTING_STORE_BACKEND",
    "PARTNER_REFERRAL_STORE_BACKEND",
    "AI_INSIGHT_STORE_BACKEND",
    "NEWS_STORE_BACKEND",
    "CUSTOM_DASHBOARD_STORE_BACKEND",
)

VALID_WORKER_TASKS = {
    "daily-email-alerts",
    "area-market-snapshots",
    "price-history-rebuild",
}

PLACEHOLDER_TOKENS = ("example.com", "change-me", "<domain>")
WEAK_POSTGRES_PASSWORDS = {"", "change-me", "password", "postgres", "domarion", "secret"}


@dataclass(frozen=True)
class Finding:
    severity: str
    message: str


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate OCI single-VM deployment files before docker compose deploy.",
    )
    parser.add_argument(
        "--env-file",
        default="/srv/domarion/env/oracle.env",
        help="Path to the OCI env file. Default: /srv/domarion/env/oracle.env.",
    )
    parser.add_argument(
        "--compose-file",
        default="compose.oracle.yaml",
        help="Path to the OCI compose file. Default: compose.oracle.yaml.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print a machine-readable JSON result.",
    )
    args = parser.parse_args(argv)

    env_path = Path(args.env_file)
    compose_path = Path(args.compose_file)
    findings: list[Finding] = []

    try:
        env = read_env_file(env_path)
    except OSError as exc:
        findings.append(Finding("error", f"Cannot read env file {env_path}: {exc}."))
        env = {}
    except ValueError as exc:
        findings.append(Finding("error", str(exc)))
        env = {}

    findings.extend(validate_files(env_path, compose_path))
    findings.extend(validate_env(env))

    errors = [finding for finding in findings if finding.severity == "error"]
    warnings = [finding for finding in findings if finding.severity == "warning"]
    status = "fail" if errors else "pass"

    result = {
        "status": status,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "findings": [
            {"severity": finding.severity, "message": finding.message}
            for finding in findings
        ],
    }
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(f"OCI preflight: {status}")
        for finding in findings:
            print(f"[{finding.severity}] {finding.message}")

    return 1 if errors else 0


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"Invalid env line {path}:{line_number}: missing '='.")
        key, value = line.split("=", 1)
        values[key.strip()] = _strip_optional_quotes(value.strip())
    return values


def validate_files(env_path: Path, compose_path: Path) -> list[Finding]:
    findings: list[Finding] = []
    if not env_path.exists():
        findings.append(Finding("error", f"Env file is missing: {env_path}."))
    if not compose_path.exists():
        findings.append(Finding("error", f"Compose file is missing: {compose_path}."))
    return findings


def validate_env(env: dict[str, str]) -> list[Finding]:
    findings: list[Finding] = []
    missing = [key for key in REQUIRED_ENV_KEYS if not env.get(key, "").strip()]
    if missing:
        findings.append(Finding("error", "Missing required env keys: " + ", ".join(missing) + "."))

    for key in ("DOMARION_FRONTEND_DOMAIN", "DOMARION_API_DOMAIN"):
        value = env.get(key, "")
        if _contains_placeholder(value):
            findings.append(Finding("error", f"{key} still contains a placeholder value: {value}."))
        if "://" in value:
            findings.append(Finding("error", f"{key} must be a hostname, not a URL."))

    data_dir = env.get("DOMARION_DATA_DIR", "")
    if data_dir and not data_dir.startswith("/"):
        findings.append(Finding("error", "DOMARION_DATA_DIR must be an absolute VM path."))

    password = env.get("POSTGRES_PASSWORD", "")
    if password.casefold() in WEAK_POSTGRES_PASSWORDS or len(password) < 16:
        findings.append(Finding("error", "POSTGRES_PASSWORD must be replaced with a strong value."))

    findings.extend(_validate_database_url(env))
    findings.extend(_validate_public_urls(env))
    findings.extend(_validate_backends(env))
    findings.extend(_validate_worker_tasks(env))
    findings.extend(_validate_production_gate(env))

    return findings


def _validate_database_url(env: dict[str, str]) -> list[Finding]:
    findings: list[Finding] = []
    database_url = env.get("DATABASE_URL", "")
    redis_url = env.get("REDIS_URL", "")
    parsed_db = urlparse(database_url)
    parsed_redis = urlparse(redis_url)

    if database_url and not parsed_db.scheme.startswith("postgresql"):
        findings.append(Finding("error", "DATABASE_URL must use a PostgreSQL scheme."))
    if database_url and parsed_db.hostname != "db":
        findings.append(Finding("error", "DATABASE_URL must point to the internal db service."))
    if database_url and parsed_db.port != 5432:
        findings.append(Finding("error", "DATABASE_URL must use internal Postgres port 5432."))
    if database_url and _contains_placeholder(database_url):
        findings.append(Finding("error", "DATABASE_URL still contains placeholder values."))
    if parsed_db.password and parsed_db.password != env.get("POSTGRES_PASSWORD"):
        findings.append(Finding("error", "DATABASE_URL password must match POSTGRES_PASSWORD."))

    if redis_url and parsed_redis.scheme != "redis":
        findings.append(
            Finding("error", "REDIS_URL must use redis:// for the internal Redis service.")
        )
    if redis_url and parsed_redis.hostname != "redis":
        findings.append(Finding("error", "REDIS_URL must point to the internal redis service."))
    if redis_url and parsed_redis.port != 6379:
        findings.append(Finding("error", "REDIS_URL must use internal Redis port 6379."))

    return findings


def _validate_public_urls(env: dict[str, str]) -> list[Finding]:
    findings: list[Finding] = []
    frontend_domain = env.get("DOMARION_FRONTEND_DOMAIN", "")
    api_domain = env.get("DOMARION_API_DOMAIN", "")
    site_url = env.get("NEXT_PUBLIC_SITE_URL", "").rstrip("/")
    api_url = env.get("NEXT_PUBLIC_API_BASE_URL", "").rstrip("/")
    parsed_site = urlparse(site_url)
    parsed_api = urlparse(api_url)

    if site_url and _contains_placeholder(site_url):
        findings.append(
            Finding("error", "NEXT_PUBLIC_SITE_URL still contains a placeholder value.")
        )
    if api_url and _contains_placeholder(api_url):
        findings.append(
            Finding("error", "NEXT_PUBLIC_API_BASE_URL still contains a placeholder value.")
        )
    if site_url and (parsed_site.scheme != "https" or parsed_site.netloc != frontend_domain):
        findings.append(
            Finding(
                "error",
                "NEXT_PUBLIC_SITE_URL must be https://DOMARION_FRONTEND_DOMAIN.",
            )
        )
    if api_url and (parsed_api.scheme != "https" or parsed_api.netloc != api_domain):
        findings.append(
            Finding(
                "error",
                "NEXT_PUBLIC_API_BASE_URL must be https://DOMARION_API_DOMAIN.",
            )
        )

    cors_origins = _parse_origins(env.get("CORS_ORIGINS", ""))
    if site_url and site_url not in cors_origins:
        findings.append(Finding("error", "CORS_ORIGINS must include NEXT_PUBLIC_SITE_URL."))
    if "*" in cors_origins:
        findings.append(Finding("error", "CORS_ORIGINS must not allow every origin."))

    if env.get("PAYMENT_PROVIDER", "").casefold() == "payu":
        expected_notify = f"{api_url}/api/v1/payment-webhooks/payu"
        if env.get("PAYU_NOTIFY_URL", "").rstrip("/") != expected_notify:
            findings.append(Finding("error", "PAYU_NOTIFY_URL must use the public API domain."))

    return findings


def _validate_backends(env: dict[str, str]) -> list[Finding]:
    non_postgres = [
        f"{key}={env.get(key, '')}"
        for key in POSTGRES_BACKEND_KEYS
        if env.get(key, "").strip().casefold() != "postgres"
    ]
    if non_postgres:
        return [
            Finding(
                "error",
                "OCI deployment must use Postgres-backed stores: " + ", ".join(non_postgres) + ".",
            )
        ]
    return []


def _validate_worker_tasks(env: dict[str, str]) -> list[Finding]:
    raw_tasks = env.get("WORKER_TASKS", "")
    tasks = {task.strip() for task in raw_tasks.split(",") if task.strip()}
    unknown = sorted(tasks - VALID_WORKER_TASKS)
    if unknown:
        return [Finding("error", "Unknown WORKER_TASKS values: " + ", ".join(unknown) + ".")]
    return []


def _validate_production_gate(env: dict[str, str]) -> list[Finding]:
    findings: list[Finding] = []
    if env.get("ENVIRONMENT", "").casefold() != "production":
        return findings

    if env.get("PAYMENT_PROVIDER", "").casefold() == "mock":
        findings.append(Finding("error", "PAYMENT_PROVIDER=mock is not allowed in production."))
    if env.get("REPORT_ARTIFACT_STORAGE_BACKEND", "").casefold() != "s3":
        findings.append(
            Finding("warning", "Production should use S3-compatible report artifact storage.")
        )
    if env.get("COST_ALERTS_CONFIGURED", "").casefold() != "true":
        findings.append(
            Finding("warning", "Set COST_ALERTS_CONFIGURED=true after OCI budget alarms exist.")
        )
    return findings


def _parse_origins(value: str) -> set[str]:
    value = value.strip()
    if not value:
        return set()
    if value.startswith("["):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {value}
        if isinstance(parsed, list):
            return {str(origin).strip().rstrip("/") for origin in parsed if str(origin).strip()}
    return {origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()}


def _strip_optional_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def _contains_placeholder(value: str) -> bool:
    folded = value.casefold()
    return any(token in folded for token in PLACEHOLDER_TOKENS)


if __name__ == "__main__":
    raise SystemExit(main())
