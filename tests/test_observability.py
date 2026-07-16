import json
import logging
import sys
from types import SimpleNamespace

from fastapi.testclient import TestClient

from domarion.main import app
from domarion.observability import (
    REQUEST_ID_HEADER,
    REQUEST_LOGGER_NAME,
    _sanitize_sentry_event,
    configure_error_tracking,
)

client = TestClient(app)


def test_request_logging_emits_structured_json(caplog) -> None:
    request_id = "test-request-id-123"
    caplog.set_level(logging.INFO, logger=REQUEST_LOGGER_NAME)

    response = client.get("/health", headers={REQUEST_ID_HEADER: request_id})

    assert response.status_code == 200
    assert response.headers[REQUEST_ID_HEADER] == request_id

    records = [record for record in caplog.records if record.name == REQUEST_LOGGER_NAME]
    assert records
    payload = json.loads(records[-1].message)
    assert payload["event"] == "http_request_completed"
    assert payload["request_id"] == request_id
    assert payload["method"] == "GET"
    assert payload["path"] == "/health"
    assert payload["status_code"] == 200
    assert payload["duration_ms"] >= 0
    assert payload["service"] == "Domarion Analytics API"
    assert payload["environment"] == "local"


def test_error_tracking_skips_empty_dsn() -> None:
    assert (
        configure_error_tracking(
            dsn=None,
            environment="local",
            release="domarion-analytics@test",
            traces_sample_rate=0.0,
        )
        is False
    )


def test_error_tracking_initializes_sentry(monkeypatch) -> None:
    calls = []

    def fake_init(**kwargs):
        calls.append(kwargs)

    monkeypatch.setitem(sys.modules, "sentry_sdk", SimpleNamespace(init=fake_init))

    enabled = configure_error_tracking(
        dsn="https://public@example.invalid/1",
        environment="staging",
        release="domarion-analytics@test",
        traces_sample_rate=0.25,
    )

    assert enabled is True
    assert calls
    assert calls[0]["dsn"] == "https://public@example.invalid/1"
    assert calls[0]["environment"] == "staging"
    assert calls[0]["release"] == "domarion-analytics@test"
    assert calls[0]["traces_sample_rate"] == 0.25
    assert calls[0]["send_default_pii"] is False
    assert calls[0]["before_send"] is _sanitize_sentry_event


def test_sentry_event_sanitizer_removes_request_payload() -> None:
    event = {
        "request": {
            "url": "https://api.example.test/check?address=Secret%20Street&price=123",
            "query_string": "address=Secret%20Street&price=123",
            "headers": {"authorization": "Bearer secret"},
            "cookies": "session=secret",
            "data": {"address": "Secret Street"},
            "env": {"REMOTE_ADDR": "127.0.0.1"},
            "method": "POST",
        }
    }

    sanitized = _sanitize_sentry_event(event)

    assert sanitized["request"] == {
        "url": "https://api.example.test/check",
        "method": "POST",
    }
