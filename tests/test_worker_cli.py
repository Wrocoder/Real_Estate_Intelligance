import json
import sys
from collections.abc import Iterator
from pathlib import Path
from types import SimpleNamespace

from domarion import cli


class _FakeBatchResult:
    def model_dump_json(self, *, indent: int | None = None) -> str:
        return json.dumps({"processed_count": 0, "dry_run": True}, indent=indent)


def test_worker_cli_runs_daily_alert_task_once(monkeypatch, capsys) -> None:
    def fake_repository() -> Iterator[object]:
        yield object()

    def fake_user_store() -> Iterator[object]:
        yield object()

    def fake_delivery(repository, user_store, payload):  # noqa: ANN001
        assert repository is not None
        assert user_store is not None
        assert payload.dry_run is True
        assert payload.limit == 1
        return _FakeBatchResult()

    monkeypatch.setattr(cli, "get_repository", fake_repository)
    monkeypatch.setattr(cli, "get_user_store", fake_user_store)
    monkeypatch.setattr(cli, "run_daily_email_alert_delivery", fake_delivery)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "domarion",
            "worker",
            "--run-once",
            "--interval-seconds",
            "0",
            "--limit",
            "1",
        ],
    )

    cli.main()

    payload = json.loads(capsys.readouterr().out)
    assert payload["worker"] == "domarion"
    assert payload["iteration"] == 1
    assert payload["tasks"] == ["daily-email-alerts"]
    assert payload["results"] == [{"processed_count": 0, "dry_run": True}]


def test_worker_cli_reports_rcn_import_to_telegram(monkeypatch, capsys) -> None:
    class FakeSession:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def commit(self) -> None:
            return None

    class FakeRcnResult:
        def as_dict(self):  # noqa: ANN001
            return {
                "rows_seen": 15,
                "rows_accepted": 14,
                "transactions_created": 4,
                "transactions_changed": 2,
                "transactions_reconfirmed": 8,
                "rows_rejected": 1,
                "rejection_reason_counts": {"non-residential": 1},
                "accepted_snapshot_fingerprint": "abc123",
                "latest_source_version": "2026-08-10T14:23:36",
                "latest_transaction_date": "2026-07-24",
                "districts_assigned": 3,
                "transactions_with_unresolved_district": 1,
            }

    monkeypatch.setenv("RCN_TRANSACTIONS_LOCATION", "local-rcn.json")
    monkeypatch.setenv("RCN_TRANSACTIONS_SOURCE_NAME", "RCN test")
    monkeypatch.setenv("ALERT_TELEGRAM_ENABLED", "true")
    monkeypatch.setenv("RCN_TRANSACTIONS_TELEGRAM_CHAT_ID", "123")
    monkeypatch.setattr(
        cli,
        "get_settings",
        lambda: SimpleNamespace(data_repository_backend="postgres"),
    )
    monkeypatch.setattr(cli, "SessionLocal", lambda: FakeSession())
    monkeypatch.setattr(cli, "import_rcn_transactions", lambda *args, **kwargs: FakeRcnResult())
    monkeypatch.setattr(
        cli,
        "send_telegram_message",
        lambda message, target=None: SimpleNamespace(
            provider="telegram:bot-api",
            status="sent",
            delivered_count=1,
            message="sent",
            metadata={"target": target, "message": message},
        ),
    )
    monkeypatch.setattr(
        sys,
        "argv",
        ["domarion", "worker", "--task", "rcn-transactions", "--run-once", "--apply"],
    )

    cli.main()

    payload = json.loads(capsys.readouterr().out)
    assert payload["results"][0]["transactions_created"] == 4
    assert payload["results"][0]["telegram"]["status"] == "sent"
    message = payload["results"][0]["telegram"]["metadata"]["message"]
    assert "Source rows: 15" in message
    assert "Accepted residential rows: 14" in message
    assert "New transactions: 4" in message
    assert "Changed transactions: 2" in message
    assert "Reconfirmed transactions: 8" in message
    assert "Top rejection reasons: non-residential: 1" in message
    assert "Latest source version: 2026-08-10T14:23:36" in message
    assert "Latest transaction date: 2026-07-24" in message
    assert "Accepted snapshot fingerprint: abc123" in message
    assert "District assignments refreshed: 3" in message
    assert "Nowe rekordy" not in message


def test_worker_cli_routes_poland_scope_to_regional_runner(monkeypatch, capsys) -> None:
    monkeypatch.setenv("RCN_TRANSACTIONS_LOCATION", "https://example.test/rcn")
    monkeypatch.setenv("RCN_TRANSACTIONS_SOURCE_NAME", "RCN test")
    monkeypatch.setenv("RCN_TRANSACTIONS_SCOPE", "poland")
    monkeypatch.setattr(
        cli,
        "get_settings",
        lambda: SimpleNamespace(data_repository_backend="postgres"),
    )
    monkeypatch.setattr(
        cli,
        "_run_poland_rcn_task",
        lambda args, **kwargs: {
            "status": "succeeded",
            "regions_processed": 16,
            "base_location": kwargs["base_location"],
        },
    )
    monkeypatch.setattr(
        sys,
        "argv",
        ["domarion", "worker", "--task", "rcn-transactions", "--run-once", "--apply"],
    )

    cli.main()

    payload = json.loads(capsys.readouterr().out)
    assert payload["results"][0]["status"] == "succeeded"
    assert payload["results"][0]["regions_processed"] == 16
    assert payload["results"][0]["base_location"] == "https://example.test/rcn"


def test_poland_runner_commits_each_region_independently(monkeypatch) -> None:
    commits = []
    imported_codes = []

    class FakeSession:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def commit(self) -> None:
            commits.append(True)

    class FakeRcnResult:
        def as_dict(self):  # noqa: ANN001
            return {
                "rows_seen": 1,
                "rows_accepted": 1,
                "rows_rejected": 0,
                "transactions_created": 1,
                "transactions_changed": 0,
                "transactions_reconfirmed": 0,
                "districts_assigned": 0,
                "transactions_with_unresolved_district": 0,
                "rejection_reason_counts": {},
                "accepted_snapshot_fingerprint": "abc",
                "latest_source_version": "2026-08-10",
                "latest_transaction_date": "2026-07-24",
            }

    def fake_import(session, location, **kwargs):  # noqa: ANN001
        imported_codes.append(kwargs["expected_teryt_prefix"])
        return FakeRcnResult()

    monkeypatch.setenv("RCN_POLAND_REGION_CODES", "12,14")
    monkeypatch.delenv("RCN_DISTRICT_BOUNDARIES_LOCATION", raising=False)
    monkeypatch.setattr(cli, "SessionLocal", FakeSession)
    monkeypatch.setattr(cli, "load_rcn_region_checkpoints", lambda *args, **kwargs: {})
    monkeypatch.setattr(cli, "import_rcn_transactions", fake_import)
    monkeypatch.setattr(cli, "_send_rcn_telegram_report", lambda payload: {"status": "sent"})

    result = cli._run_poland_rcn_task(
        SimpleNamespace(apply=True),
        base_location="https://mapy.geoportal.gov.pl/wss/service/rcn",
        source_name="RCN GUGiK",
    )

    assert result["status"] == "succeeded"
    assert result["regions_processed"] == 2
    assert result["regions_failed"] == []
    assert imported_codes == ["12", "14"]
    assert len(commits) == 2


def test_boundary_environment_uses_manifest_and_legacy_fallback(
    monkeypatch,
    tmp_path: Path,
) -> None:
    manifest = tmp_path / "districts.json"
    manifest.write_text(
        json.dumps(
            [
                {
                    "city": "Kraków",
                    "location": "krakow.zip",
                    "source_name": "MSIP Kraków",
                    "source_crs": 2178,
                }
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("RCN_DISTRICT_BOUNDARIES_MANIFEST", str(manifest))
    monkeypatch.setenv("RCN_DISTRICT_BOUNDARIES_LOCATION", "/data/wroclaw.zip")

    configs = cli._district_boundary_configs_from_environment()

    assert [config.city for config in configs] == ["Kraków", "Wrocław"]
    assert configs[0].location == str(tmp_path / "krakow.zip")
    assert configs[1].source_crs == 2177
