from fastapi.testclient import TestClient

from domarion.core import get_settings
from domarion.main import app
from domarion.report_store.factory import memory_report_store
from domarion.services import report_delivery

client = TestClient(app)


def test_generate_and_list_saved_html_report() -> None:
    memory_report_store.clear()

    response = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["listing_id"] == "wr-001"
    assert payload["report_format"] == "html"
    assert payload["content_type"].startswith("text/html")
    assert "Domarion Analytics" in payload["content"]
    assert payload["report_metadata"]["investment_score"] >= 0
    assert payload["report_metadata"]["fair_price_confidence_score"] >= 0
    assert payload["report_metadata"]["report_template_code"] == "buyer_object_report_v1"
    assert payload["report_metadata"]["scoring_formula_version"] == "domarion-scoring-v1"

    list_response = client.get("/api/v1/reports")
    reports = list_response.json()

    assert list_response.status_code == 200
    assert len(reports) == 1
    assert reports[0]["id"] == payload["id"]
    assert "content" not in reports[0]


def test_get_saved_report_and_content() -> None:
    memory_report_store.clear()
    created = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "investor", "report_format": "html"},
    ).json()

    report_response = client.get(f"/api/v1/reports/{created['id']}")
    content_response = client.get(f"/api/v1/reports/{created['id']}/content")

    assert report_response.status_code == 200
    assert report_response.json()["audience"] == "investor"
    assert content_response.status_code == 200
    assert content_response.headers["content-type"].startswith("text/html")
    assert "Инвестиционная оценка" in content_response.text


def test_email_saved_report_dry_run() -> None:
    memory_report_store.clear()
    headers = {
        "X-Domarion-User-Id": "report-email-owner",
        "X-Domarion-Email": "owner@example.com",
    }
    created = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    ).json()

    response = client.post(
        f"/api/v1/reports/{created['id']}/email",
        headers=headers,
        json={"dry_run": True},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "dry_run"
    assert payload["provider"] == "email:dry-run"
    assert payload["target_email"] == "owner@example.com"
    assert payload["subject"] == "Domarion report: 3 pokoje przy planowanej trasie tramwajowej"


def test_email_report_is_owner_scoped() -> None:
    memory_report_store.clear()
    owner_a = {"X-Domarion-User-Id": "report-email-owner-a"}
    owner_b = {"X-Domarion-User-Id": "report-email-owner-b"}
    created = client.post(
        "/api/v1/reports/object/generate",
        headers=owner_a,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    ).json()

    response = client.post(
        f"/api/v1/reports/{created['id']}/email",
        headers=owner_b,
        json={"dry_run": True},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Report not found"


def test_email_saved_report_sends_smtp_message(monkeypatch) -> None:
    memory_report_store.clear()
    sent_messages = []
    smtp_sessions = []

    class FakeSMTP:
        def __init__(self, host: str, port: int, timeout: float) -> None:
            self.host = host
            self.port = port
            self.timeout = timeout
            self.started_tls = False
            self.login_args = None
            smtp_sessions.append(self)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback) -> None:
            return None

        def starttls(self) -> None:
            self.started_tls = True

        def login(self, username: str, password: str) -> None:
            self.login_args = (username, password)

        def send_message(self, message) -> None:
            sent_messages.append(message)

    monkeypatch.setenv("ALERT_EMAIL_ENABLED", "true")
    monkeypatch.setenv("ALERT_EMAIL_SENDER", "reports@example.com")
    monkeypatch.setenv("ALERT_SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("ALERT_SMTP_PORT", "2525")
    monkeypatch.setenv("ALERT_SMTP_USERNAME", "smtp-user")
    monkeypatch.setenv("ALERT_SMTP_PASSWORD", "smtp-pass")
    monkeypatch.setenv("ALERT_SMTP_USE_TLS", "true")
    monkeypatch.setattr(report_delivery.smtplib, "SMTP", FakeSMTP)
    get_settings.cache_clear()
    headers = {
        "X-Domarion-User-Id": "report-smtp-owner",
        "X-Domarion-Email": "owner@example.com",
    }
    created = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    ).json()

    response = client.post(
        f"/api/v1/reports/{created['id']}/email",
        headers=headers,
        json={"dry_run": False},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["status"] == "sent"
    assert payload["provider"] == "email:smtp"
    assert smtp_sessions[0].host == "smtp.example.com"
    assert smtp_sessions[0].port == 2525
    assert smtp_sessions[0].started_tls is True
    assert smtp_sessions[0].login_args == ("smtp-user", "smtp-pass")
    assert sent_messages[0]["To"] == "owner@example.com"
    assert sent_messages[0]["From"] == "reports@example.com"
    assert "Domarion report" in sent_messages[0]["Subject"]
    assert sent_messages[0].get_body(preferencelist=("html",)) is not None
    get_settings.cache_clear()


def test_generate_saved_realtor_report_stores_branding_metadata() -> None:
    memory_report_store.clear()

    response = client.post(
        "/api/v1/reports/object/generate",
        json={
            "listing_id": "wr-001",
            "audience": "realtor",
            "report_format": "html",
            "branding": {
                "agency_name": "Example Realty",
                "agent_name": "Anna Agent",
            },
        },
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["report_metadata"]["report_template_code"] == "realtor_client_report_v1"
    assert payload["report_metadata"]["report_branding"] == {
        "agency_name": "Example Realty",
        "agent_name": "Anna Agent",
    }
    assert "Example Realty" in payload["content"]


def test_generate_saved_json_report() -> None:
    memory_report_store.clear()

    response = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "json"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["report_format"] == "json"
    assert payload["content_type"] == "application/json"
    assert '"listing_id": "wr-001"' in payload["content"]


def test_get_missing_saved_report_returns_404() -> None:
    memory_report_store.clear()

    response = client.get("/api/v1/reports/not-found")

    assert response.status_code == 404
    assert response.json()["detail"] == "Report not found"
