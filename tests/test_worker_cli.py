import json
import sys
from collections.abc import Iterator

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
