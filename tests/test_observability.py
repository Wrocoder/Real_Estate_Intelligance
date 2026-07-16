import json
import logging

from fastapi.testclient import TestClient

from domarion.main import app
from domarion.observability import REQUEST_ID_HEADER, REQUEST_LOGGER_NAME

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
