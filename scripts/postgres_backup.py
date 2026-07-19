from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import UTC, datetime, timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backup or restore Domarion PostgreSQL/PostGIS via pg_dump/pg_restore.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    backup_parser = subparsers.add_parser("backup", help="Create a compressed custom pg_dump.")
    _add_database_args(backup_parser)
    backup_parser.add_argument(
        "--output-dir",
        default=os.getenv("BACKUP_OUTPUT_DIR", ".domarion/backups/postgres"),
        help="Directory for local backup artifacts.",
    )
    backup_parser.add_argument(
        "--prefix",
        default=os.getenv("BACKUP_PREFIX", "domarion-postgres"),
        help="Backup filename prefix.",
    )
    backup_parser.add_argument(
        "--retention-days",
        type=int,
        default=int(os.getenv("BACKUP_RETENTION_DAYS", "14")),
        help="Delete local backups older than this many days after a successful backup.",
    )
    backup_parser.add_argument(
        "--pg-dump",
        default=os.getenv("PG_DUMP_BIN", "pg_dump"),
        help="pg_dump executable path.",
    )
    backup_parser.add_argument(
        "--s3-bucket",
        default=os.getenv("BACKUP_S3_BUCKET"),
        help="Optional S3-compatible bucket for offsite backup copy.",
    )
    backup_parser.add_argument(
        "--s3-prefix",
        default=os.getenv("BACKUP_S3_PREFIX", "domarion/postgres"),
        help="Object key prefix for optional S3 upload.",
    )
    backup_parser.add_argument(
        "--s3-endpoint-url",
        default=os.getenv("BACKUP_S3_ENDPOINT_URL"),
        help="Optional S3-compatible endpoint URL.",
    )
    backup_parser.add_argument(
        "--s3-region",
        default=os.getenv("BACKUP_S3_REGION", "eu-central-1"),
        help="S3 region for optional upload.",
    )
    backup_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned paths/commands without running pg_dump, prune or upload.",
    )

    restore_parser = subparsers.add_parser(
        "restore",
        help="Restore a custom-format dump into the configured database.",
    )
    _add_database_args(restore_parser)
    restore_parser.add_argument("backup_path", help="Path to .dump backup artifact.")
    restore_parser.add_argument(
        "--pg-restore",
        default=os.getenv("PG_RESTORE_BIN", "pg_restore"),
        help="pg_restore executable path.",
    )
    restore_parser.add_argument(
        "--clean",
        action="store_true",
        help="Drop existing database objects before restore with --clean --if-exists.",
    )
    restore_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned command without running pg_restore.",
    )

    args = parser.parse_args()
    if args.command == "backup":
        payload = run_backup(args)
    elif args.command == "restore":
        payload = run_restore(args)
    else:
        raise SystemExit(f"Unknown command: {args.command}")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def run_backup(args: argparse.Namespace) -> dict[str, object]:
    database_url = _database_url(args.database_url)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    backup_path = output_dir / backup_file_name(args.prefix)
    pg_env = pg_env_from_database_url(database_url)
    command = build_pg_dump_command(args.pg_dump, backup_path)

    if not args.dry_run:
        subprocess.run(command, env={**os.environ, **pg_env}, check=True)
    s3_uri = None if args.dry_run else upload_backup_to_s3(backup_path, args)
    pruned = prune_old_backups(
        output_dir,
        prefix=args.prefix,
        retention_days=args.retention_days,
        dry_run=args.dry_run,
    )
    return {
        "action": "backup",
        "dry_run": args.dry_run,
        "backup_path": str(backup_path),
        "command": command,
        "s3_uri": s3_uri,
        "pruned_local_backups": [str(path) for path in pruned],
    }


def run_restore(args: argparse.Namespace) -> dict[str, object]:
    database_url = _database_url(args.database_url)
    backup_path = Path(args.backup_path)
    if not args.dry_run and not backup_path.exists():
        raise SystemExit(f"Backup file does not exist: {backup_path}")
    pg_env = pg_env_from_database_url(database_url)
    command = build_pg_restore_command(
        args.pg_restore,
        backup_path,
        database_name=pg_env["PGDATABASE"],
        clean=args.clean,
    )
    if not args.dry_run:
        subprocess.run(command, env={**os.environ, **pg_env}, check=True)
    return {
        "action": "restore",
        "dry_run": args.dry_run,
        "backup_path": str(backup_path),
        "command": command,
        "database": pg_env["PGDATABASE"],
    }


def pg_env_from_database_url(database_url: str) -> dict[str, str]:
    parsed = urlsplit(normalize_database_url(database_url))
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ValueError(f"Unsupported database URL scheme: {parsed.scheme}")
    if not parsed.hostname:
        raise ValueError("Database URL requires a hostname.")
    database_name = unquote(parsed.path.lstrip("/"))
    if not database_name:
        raise ValueError("Database URL requires a database name.")

    env = {
        "PGHOST": parsed.hostname,
        "PGDATABASE": database_name,
    }
    if parsed.port is not None:
        env["PGPORT"] = str(parsed.port)
    if parsed.username:
        env["PGUSER"] = unquote(parsed.username)
    if parsed.password:
        env["PGPASSWORD"] = unquote(parsed.password)

    query = parse_qs(parsed.query)
    for query_key, env_key in {
        "sslmode": "PGSSLMODE",
        "sslrootcert": "PGSSLROOTCERT",
        "sslcert": "PGSSLCERT",
        "sslkey": "PGSSLKEY",
    }.items():
        if query.get(query_key):
            env[env_key] = query[query_key][0]
    return env


def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql+psycopg://"):
        return database_url.replace("postgresql+psycopg://", "postgresql://", 1)
    if database_url.startswith("postgresql+psycopg2://"):
        return database_url.replace("postgresql+psycopg2://", "postgresql://", 1)
    return database_url


def build_pg_dump_command(pg_dump_bin: str, backup_path: Path) -> list[str]:
    return [
        pg_dump_bin,
        "--format=custom",
        "--compress=9",
        "--no-owner",
        "--no-privileges",
        "--file",
        str(backup_path),
    ]


def build_pg_restore_command(
    pg_restore_bin: str,
    backup_path: Path,
    *,
    database_name: str,
    clean: bool,
) -> list[str]:
    command = [
        pg_restore_bin,
        "--no-owner",
        "--no-privileges",
        "--dbname",
        database_name,
    ]
    if clean:
        command.extend(["--clean", "--if-exists"])
    command.append(str(backup_path))
    return command


def backup_file_name(prefix: str, timestamp: datetime | None = None) -> str:
    value = timestamp or datetime.now(UTC)
    return f"{prefix}-{value.strftime('%Y%m%dT%H%M%SZ')}.dump"


def prune_old_backups(
    output_dir: Path,
    *,
    prefix: str,
    retention_days: int,
    dry_run: bool,
    now: datetime | None = None,
) -> list[Path]:
    if retention_days < 0:
        return []
    cutoff = (now or datetime.now(UTC)) - timedelta(days=retention_days)
    pruned: list[Path] = []
    for path in sorted(output_dir.glob(f"{prefix}-*.dump")):
        modified_at = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
        if modified_at >= cutoff:
            continue
        pruned.append(path)
        if not dry_run:
            path.unlink()
    return pruned


def upload_backup_to_s3(backup_path: Path, args: argparse.Namespace) -> str | None:
    if not args.s3_bucket:
        return None
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - project dependency should include boto3.
        raise SystemExit("S3 backup upload requires boto3 to be installed.") from exc

    key = "/".join(
        part.strip("/")
        for part in [args.s3_prefix, backup_path.name]
        if part and part.strip("/")
    )
    client = boto3.client(
        "s3",
        endpoint_url=args.s3_endpoint_url,
        region_name=args.s3_region,
    )
    client.upload_file(str(backup_path), args.s3_bucket, key)
    return f"s3://{args.s3_bucket}/{key}"


def _add_database_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL"),
        help="SQLAlchemy/PostgreSQL URL. Defaults to DATABASE_URL.",
    )


def _database_url(value: str | None) -> str:
    if not value:
        raise SystemExit("Missing database URL. Set DATABASE_URL or pass --database-url.")
    return value


if __name__ == "__main__":
    raise SystemExit(main())
