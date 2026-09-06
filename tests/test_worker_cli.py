import json
import sys
from collections.abc import Iterator
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
                "transactions_created": 4,
                "transactions_changed": 2,
                "transactions_reconfirmed": 8,
                "rows_rejected": 1,
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
    assert "New transactions: 4" in message
    assert "Changed transactions: 2" in message
    assert "Reconfirmed transactions: 8" in message
    assert "Nowe rekordy" not in message
