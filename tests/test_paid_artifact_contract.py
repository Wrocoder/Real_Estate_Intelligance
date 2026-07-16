import json
from hashlib import sha256
from pathlib import Path

from fastapi.testclient import TestClient

from domarion.ai_insight_store.factory import memory_ai_insight_store
from domarion.auth_store.factory import memory_auth_store
from domarion.core.config import get_settings
from domarion.main import app
from domarion.report_order_store.factory import memory_report_order_store
from domarion.report_store.factory import memory_report_store
from domarion.user_store.factory import memory_user_store
from domarion.user_submitted_listing_store.factory import memory_user_submitted_listing_store

client = TestClient(app)


def setup_function() -> None:
    get_settings.cache_clear()
    memory_ai_insight_store.clear()
    memory_auth_store.clear()
    memory_report_order_store.clear()
    memory_report_store.clear()
    memory_user_submitted_listing_store.clear()
    memory_user_store.clear()


def teardown_function() -> None:
    get_settings.cache_clear()


def test_paid_full_object_analysis_artifact_and_metadata_contract(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setenv("REPORT_ARTIFACT_STORAGE_BACKEND", "local")
    monkeypatch.setenv("REPORT_ARTIFACT_LOCAL_DIR", str(tmp_path))
    monkeypatch.setenv("REPORT_ARTIFACT_PUBLIC_BASE_URL", "https://cdn.example.test/reports")
    get_settings.cache_clear()
    headers = {"X-Domarion-User-Id": "paid-artifact-contract-object"}

    checkout = _create_order(
        headers,
        listing_id="wr-001",
        product_code="full_object_analysis",
        report_format="html",
    )
    order = checkout["order"]
    fulfilled, report = _pay_fulfill_and_get_report(headers, order)
    metadata = report["report_metadata"]

    assert fulfilled["status"] == "fulfilled"
    assert fulfilled["generated_report_id"] == report["id"]
    assert report["owner_id"] == "paid-artifact-contract-object"
    assert report["listing_id"] == "wr-001"
    assert report["report_format"] == "html"
    assert report["content_type"].startswith("text/html")
    assert "Full Object Analysis Summary" in report["content"]
    assert "Due diligence deep dive" in report["content"]
    assert metadata["paid_order_id"] == order["id"]
    assert metadata["paid_order_invoice_requested"] is False
    assert metadata["report_product_code"] == "full_object_analysis"
    assert metadata["report_template_code"] == "full_object_analysis_v1"
    _assert_score_metadata(metadata)
    _assert_local_artifact_metadata(metadata, tmp_path, report["content"])
    _assert_generated_report_list_contract(headers, report["id"])

    content = client.get(f"/api/v1/reports/{report['id']}/content", headers=headers)
    pdf = client.get(f"/api/v1/reports/{report['id']}/pdf", headers=headers)
    events = client.get(f"/api/v1/report-orders/{order['id']}/events", headers=headers).json()

    assert content.status_code == 200
    assert content.headers["content-type"].startswith("text/html")
    assert content.text == report["content"]
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")
    assert any(
        event["event_type"] == "report_fulfilled"
        and event["metadata"]["generated_report_id"] == report["id"]
        for event in events
    )


def test_paid_user_submitted_draft_report_metadata_does_not_leak_private_url() -> None:
    headers = {"X-Domarion-User-Id": "paid-artifact-contract-draft"}
    source_url = "https://www.otodom.pl/pl/oferta/private-contract-reference-ID123"
    draft = client.post(
        "/api/v1/user-submitted-listings/analyze",
        headers=headers,
        json={
            "source_url": source_url,
            "address": "Nowy Dwór, Wrocław",
            "city": "Wrocław",
            "district": "Fabryczna",
            "market_type": "secondary",
            "price": 675000,
            "area_m2": 58.4,
            "rooms": 3,
            "confirm_private_analysis": True,
        },
    ).json()

    checkout = _create_order(
        headers,
        listing_id=f"draft:{draft['draft_id']}",
        product_code="object_report",
        report_format="html",
    )
    order = checkout["order"]
    _, report = _pay_fulfill_and_get_report(headers, order)
    metadata = report["report_metadata"]

    assert report["listing_id"].startswith("user-submitted-")
    assert metadata["paid_order_id"] == order["id"]
    assert metadata["report_product_code"] == "object_report"
    assert metadata["user_submitted_draft_id"] == draft["draft_id"]
    assert metadata["source_domain"] == "otodom.pl"
    assert metadata["private_source_reference_present"] is True
    assert "source_url" not in metadata
    assert "source_url_private" not in metadata
    assert source_url not in report["content"]
    assert source_url not in json.dumps(metadata, ensure_ascii=False)
    _assert_score_metadata(metadata)


def test_paid_area_json_and_bundle_receipt_metadata_contract() -> None:
    headers = {"X-Domarion-User-Id": "paid-artifact-contract-area-bundle"}

    area_checkout = _create_order(
        headers,
        listing_id="area:wroclaw-fabryczna",
        product_code="area_report",
        report_format="json",
    )
    area_order = area_checkout["order"]
    _, area_report = _pay_fulfill_and_get_report(headers, area_order)
    area_metadata = area_report["report_metadata"]
    area_content = json.loads(area_report["content"])

    assert area_report["listing_id"] == "area:wroclaw-fabryczna"
    assert area_report["content_type"] == "application/json"
    assert area_metadata["paid_order_id"] == area_order["id"]
    assert area_metadata["paid_order_invoice_requested"] is False
    assert area_metadata["area_id"] == "wroclaw-fabryczna"
    assert area_metadata["city"] == "Wrocław"
    assert area_metadata["district"] == "Fabryczna"
    assert area_metadata["report_template_code"] == "area_market_report_v1"
    assert isinstance(area_metadata["median_price_per_m2"], int)
    assert isinstance(area_metadata["liquidity_index"], int)
    assert area_content["template_code"] == "area_market_report_v1"
    assert area_content["area"]["area_id"] == "wroclaw-fabryczna"
    _assert_generated_report_list_contract(headers, area_report["id"])

    bundle_checkout = _create_order(
        headers,
        listing_id="bundle:reports-5",
        product_code="report_bundle_5",
        report_format="json",
    )
    bundle_order = bundle_checkout["order"]
    _, receipt = _pay_fulfill_and_get_report(headers, bundle_order)
    receipt_metadata = receipt["report_metadata"]
    receipt_content = json.loads(receipt["content"])

    assert receipt["listing_id"] == "bundle:reports-5"
    assert receipt["content_type"] == "application/json"
    assert receipt_metadata["paid_order_id"] == bundle_order["id"]
    assert receipt_metadata["paid_order_invoice_requested"] is False
    assert receipt_metadata["report_product_code"] == "report_bundle_5"
    assert receipt_metadata["report_bundle_receipt"] is True
    assert receipt_metadata["report_credits_granted"] == 5
    assert receipt_metadata["report_credit_bundle_order_id"] == bundle_order["id"]
    assert receipt_content == {
        "template_code": "report_bundle_receipt_v1",
        "order_id": bundle_order["id"],
        "credits_granted": 5,
        "summary": receipt["summary"],
    }
    _assert_generated_report_list_contract(headers, receipt["id"])


def _create_order(
    headers: dict[str, str],
    *,
    listing_id: str,
    product_code: str,
    report_format: str,
) -> dict:
    response = client.post(
        "/api/v1/report-orders",
        headers=headers,
        json={
            "listing_id": listing_id,
            "product_code": product_code,
            "report_format": report_format,
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["order"]["listing_id"] == listing_id
    assert payload["order"]["product_code"] == product_code
    assert payload["order"]["report_format"] == report_format
    assert payload["order"]["checkout_url"] == payload["checkout_url"]
    return payload


def _pay_fulfill_and_get_report(
    headers: dict[str, str],
    order: dict,
) -> tuple[dict, dict]:
    paid = client.post(f"/api/v1/report-orders/{order['id']}/mock-pay", headers=headers)
    fulfilled = client.post(f"/api/v1/report-orders/{order['id']}/fulfill", headers=headers)

    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"
    assert fulfilled.status_code == 200
    payload = fulfilled.json()
    assert payload["status"] == "fulfilled"
    assert payload["generated_report_id"]

    report = client.get(
        f"/api/v1/reports/{payload['generated_report_id']}",
        headers=headers,
    )
    assert report.status_code == 200
    return payload, report.json()


def _assert_score_metadata(metadata: dict) -> None:
    required_keys = {
        "investment_score",
        "risk_score",
        "negotiation_score",
        "decision_label",
        "price_label",
        "risk_label",
        "negotiation_label",
        "fair_price_confidence_score",
        "scoring_formula_version",
        "scoring_weights_profile",
        "report_template_code",
        "report_template_name",
    }
    assert required_keys <= set(metadata)
    assert all(0 <= metadata[key] <= 100 for key in ("investment_score", "risk_score"))
    assert isinstance(metadata["decision_label"], str)
    assert isinstance(metadata["price_label"], str)
    assert isinstance(metadata["scoring_formula_version"], str)
    assert isinstance(metadata["scoring_weights_profile"], str)


def _assert_local_artifact_metadata(metadata: dict, base_dir: Path, content: str) -> None:
    assert metadata["artifact_storage_backend"] == "local"
    assert metadata["artifact_size_bytes"] == len(content.encode("utf-8"))
    assert metadata["artifact_content_sha256"] == sha256(content.encode("utf-8")).hexdigest()
    assert metadata["artifact_public_url"].startswith("https://cdn.example.test/reports/")

    artifact_key = metadata["artifact_storage_key"]
    artifact_path = base_dir.joinpath(*Path(artifact_key).parts)
    assert artifact_key.startswith("reports/paid-artifact-contract-object/")
    assert artifact_key.endswith(".html")
    assert artifact_path.read_text(encoding="utf-8") == content


def _assert_generated_report_list_contract(headers: dict[str, str], report_id: str) -> None:
    reports = client.get("/api/v1/reports", headers=headers).json()
    item = next(report for report in reports if report["id"] == report_id)

    assert {
        "id",
        "owner_id",
        "listing_id",
        "audience",
        "report_format",
        "content_type",
        "title",
        "summary",
        "created_at",
    } <= set(item)
    assert "content" not in item
    assert "report_metadata" not in item
