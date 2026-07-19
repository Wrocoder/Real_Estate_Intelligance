import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

from scripts.postgres_backup import (
    backup_file_name,
    build_pg_dump_command,
    build_pg_restore_command,
    normalize_database_url,
    pg_env_from_database_url,
    prune_old_backups,
)


def test_pg_env_from_sqlalchemy_database_url_keeps_secret_out_of_command() -> None:
    env = pg_env_from_database_url(
        "postgresql+psycopg://domarion:p%40ss@db.example.com:5432/domarion"
        "?sslmode=require"
    )
    command = build_pg_dump_command("pg_dump", Path("backup.dump"))

    assert env["PGHOST"] == "db.example.com"
    assert env["PGPORT"] == "5432"
    assert env["PGDATABASE"] == "domarion"
    assert env["PGUSER"] == "domarion"
    assert env["PGPASSWORD"] == "p@ss"
    assert env["PGSSLMODE"] == "require"
    assert "p@ss" not in " ".join(command)
    assert "db.example.com" not in " ".join(command)


def test_backup_and_restore_commands_are_custom_format_safe() -> None:
    backup_path = Path(".domarion/backups/postgres/domarion-postgres.dump")
    dump_command = build_pg_dump_command("/usr/bin/pg_dump", backup_path)
    restore_command = build_pg_restore_command(
        "/usr/bin/pg_restore",
        backup_path,
        database_name="domarion",
        clean=True,
    )

    assert dump_command == [
        "/usr/bin/pg_dump",
        "--format=custom",
        "--compress=9",
        "--no-owner",
        "--no-privileges",
        "--file",
        str(backup_path),
    ]
    assert restore_command == [
        "/usr/bin/pg_restore",
        "--no-owner",
        "--no-privileges",
        "--dbname",
        "domarion",
        "--clean",
        "--if-exists",
        str(backup_path),
    ]


def test_backup_filename_and_url_normalization_are_stable() -> None:
    timestamp = datetime(2026, 7, 19, 12, 30, tzinfo=UTC)

    assert backup_file_name("domarion-postgres", timestamp) == (
        "domarion-postgres-20260719T123000Z.dump"
    )
    assert normalize_database_url("postgresql+psycopg://u:p@host/db") == (
        "postgresql://u:p@host/db"
    )


def test_prune_old_backups_respects_retention(tmp_path: Path) -> None:
    now = datetime(2026, 7, 19, 12, tzinfo=UTC)
    old_backup = tmp_path / "domarion-postgres-20260701T000000Z.dump"
    fresh_backup = tmp_path / "domarion-postgres-20260718T000000Z.dump"
    old_backup.write_text("old", encoding="utf-8")
    fresh_backup.write_text("fresh", encoding="utf-8")
    old_mtime = (now - timedelta(days=30)).timestamp()
    fresh_mtime = (now - timedelta(days=1)).timestamp()
    os.utime(old_backup, (old_mtime, old_mtime))
    os.utime(fresh_backup, (fresh_mtime, fresh_mtime))

    pruned = prune_old_backups(
        tmp_path,
        prefix="domarion-postgres",
        retention_days=14,
        dry_run=False,
        now=now,
    )

    assert pruned == [old_backup]
    assert not old_backup.exists()
    assert fresh_backup.exists()
