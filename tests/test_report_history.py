import csv
import io

from fastapi.testclient import TestClient

from domarion.ai_insight_store.factory import memory_ai_insight_store
from domarion.core import get_settings
from domarion.main import app
from domarion.report_store.factory import memory_report_store
from domarion.services import report_delivery

client = TestClient(app)


def test_generate_and_list_saved_html_report() -> None:
    memory_report_store.clear()
    memory_ai_insight_store.clear()

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
    assert payload["report_metadata"]["decision_label"]
    assert payload["report_metadata"]["price_label"]
    assert payload["report_metadata"]["risk_label"]
    assert payload["report_metadata"]["negotiation_label"]
    assert payload["report_metadata"]["fair_price_confidence_score"] >= 0
    assert payload["report_metadata"]["report_template_code"] == "buyer_object_report_v1"
    assert payload["report_metadata"]["scoring_formula_version"] == "domarion-scoring-v1"
    assert '<section class="scores">' in payload["content"]

    list_response = client.get("/api/v1/reports")
    reports = list_response.json()

    assert list_response.status_code == 200
    assert len(reports) == 1
    assert reports[0]["id"] == payload["id"]
    assert "content" not in reports[0]


def test_generated_object_report_persists_ai_insights() -> None:
    memory_report_store.clear()
    memory_ai_insight_store.clear()
    headers = {"X-Domarion-User-Id": "insight-owner"}

    response = client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    )
    report = response.json()

    insights_response = client.get(
        "/api/v1/ai-insights",
        headers=headers,
        params={"subject_id": "wr-001"},
    )
    insights = insights_response.json()
    insight_types = {item["insight_type"] for item in insights}
    explanation = next(item for item in insights if item["insight_type"] == "object_explanation")
    detail = client.get(f"/api/v1/ai-insights/{explanation['id']}", headers=headers).json()
    other_owner_list = client.get(
        "/api/v1/ai-insights",
        headers={"X-Domarion-User-Id": "other-insight-owner"},
    ).json()
    other_owner_detail = client.get(
        f"/api/v1/ai-insights/{explanation['id']}",
        headers={"X-Domarion-User-Id": "other-insight-owner"},
    )

    assert response.status_code == 200
    assert insights_response.status_code == 200
    assert insight_types == {"report_summary", "object_explanation"}
    assert all(item["source_report_id"] == report["id"] for item in insights)
    assert detail["content"].startswith(report["summary"])
    assert "investment" in detail["content"]
    assert detail["metadata"]["report_template_code"] == "buyer_object_report_v1"
    assert other_owner_list == []
    assert other_owner_detail.status_code == 404


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


def test_get_saved_html_report_pdf_export_is_owner_scoped() -> None:
    memory_report_store.clear()
    owner_headers = {"X-Domarion-User-Id": "report-pdf-owner"}
    other_headers = {"X-Domarion-User-Id": "report-pdf-other"}
    created = client.post(
        "/api/v1/reports/object/generate",
        headers=owner_headers,
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
    ).json()

    pdf_response = client.get(f"/api/v1/reports/{created['id']}/pdf", headers=owner_headers)
    other_response = client.get(f"/api/v1/reports/{created['id']}/pdf", headers=other_headers)

    assert pdf_response.status_code == 200
    assert pdf_response.headers["content-type"] == "application/pdf"
    assert pdf_response.headers["content-disposition"] == (
        f'attachment; filename="domarion-report-{created["id"]}.pdf"'
    )
    assert pdf_response.content.startswith(b"%PDF-1.4")
    assert b"/Type /Catalog" in pdf_response.content
    assert (
        b"/CIDToGIDMap" in pdf_response.content
        or b"/BaseFont /Helvetica" in pdf_response.content
    )
    assert other_response.status_code == 404
    assert other_response.json()["detail"] == "Report not found"


def test_get_saved_json_report_pdf_export() -> None:
    memory_report_store.clear()
    created = client.post(
        "/api/v1/reports/object/generate",
        json={"listing_id": "wr-001", "audience": "buyer", "report_format": "json"},
    ).json()

    response = client.get(f"/api/v1/reports/{created['id']}/pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-1.4")


def test_export_reports_json_and_csv_for_export_capable_plan() -> None:
    memory_report_store.clear()
    headers = {
        "X-Domarion-User-Id": "report-export-owner",
        "X-Domarion-Role": "realtor",
        "X-Domarion-Plan": "realtor",
    }
    other_headers = {"X-Domarion-User-Id": "report-export-other"}
    client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-001", "audience": "realtor", "report_format": "html"},
    )
    client.post(
        "/api/v1/reports/object/generate",
        headers=headers,
        json={"listing_id": "wr-002", "audience": "investor", "report_format": "json"},
    )
    client.post(
        "/api/v1/reports/object/generate",
        headers=other_headers,
        json={"listing_id": "wr-003", "audience": "buyer", "report_format": "html"},
    )

    json_response = client.get(
        "/api/v1/reports/export",
        headers=headers,
        params={"format": "json", "audience": "realtor"},
    )
    csv_response = client.get(
        "/api/v1/reports/export",
        headers=headers,
        params={"format": "csv"},
    )
    csv_rows = list(csv.DictReader(io.StringIO(csv_response.text)))

    assert json_response.status_code == 200
    assert json_response.headers["content-disposition"] == (
        'attachment; filename="domarion-reports.json"'
    )
    assert len(json_response.json()) == 1
    assert json_response.json()[0]["owner_id"] == "report-export-owner"
    assert json_response.json()[0]["audience"] == "realtor"
    assert json_response.json()[0]["report_template_code"] == "realtor_client_report_v1"
    assert "content" not in json_response.json()[0]

    assert csv_response.status_code == 200
    assert csv_response.headers["content-disposition"] == (
        'attachment; filename="domarion-reports.csv"'
    )
    assert len(csv_rows) == 2
    assert {row["owner_id"] for row in csv_rows} == {"report-export-owner"}
    assert {"id", "listing_id", "report_template_code", "content_url", "pdf_url"} <= set(
        csv_rows[0]
    )
    assert csv_rows[0]["pdf_url"].startswith("/api/v1/reports/")


def test_export_reports_requires_export_capability() -> None:
    memory_report_store.clear()
    response = client.get(
        "/api/v1/reports/export",
        headers={"X-Domarion-User-Id": "free-export-user"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["resource"] == "exports"
    assert response.json()["detail"]["required_capability"] == "can_export"


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
