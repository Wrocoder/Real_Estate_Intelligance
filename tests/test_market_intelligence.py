import pytest
from fastapi.testclient import TestClient

from domarion.main import app
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import MarketIntelligenceAudience
from domarion.services.market_intelligence import build_market_intelligence_report

client = TestClient(app)


@pytest.mark.parametrize(
    ("audience", "expected_prefix"),
    [
        ("bank", "Bank view"),
        ("developer", "Developer view"),
        ("fund", "Fund view"),
    ],
)
def test_market_intelligence_report_builds_audience_specific_sections(
    audience: MarketIntelligenceAudience,
    expected_prefix: str,
) -> None:
    report = build_market_intelligence_report(
        InMemoryRealEstateRepository(),
        audience=audience,
        city="Wrocław",
        area_limit=2,
    )

    assert report.audience == audience
    assert report.executive_summary.startswith(expected_prefix)
    assert report.dashboard.listings_count >= 3
    assert report.area_comparison.area_count >= 3
    assert 1 <= len(report.area_watchlist) <= 2
    assert report.kpis
    assert report.findings
    assert report.opportunities
    assert report.risks
    assert report.recommended_actions
    assert report.source_notes
    assert "not financial" in report.disclaimer


def test_market_intelligence_report_supports_district_scope() -> None:
    report = build_market_intelligence_report(
        InMemoryRealEstateRepository(),
        audience="developer",
        city="Wrocław",
        district="Fabryczna",
        area_limit=3,
    )

    assert report.market_scope == "Fabryczna, Wrocław"
    assert report.dashboard.district == "Fabryczna"
    assert report.dashboard.listings_count >= 1
    assert report.area_watchlist
    assert report.area_watchlist[0].name == "Fabryczna"


def test_market_intelligence_api_requires_export_capability() -> None:
    response = client.get(
        "/api/v1/market/intelligence-report",
        headers={"X-Domarion-User-Id": "free-market-intel"},
        params={"audience": "bank", "city": "Wrocław"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["required_capability"] == "can_export"


def test_market_intelligence_api_returns_report_for_enterprise_plan() -> None:
    response = client.get(
        "/api/v1/market/intelligence-report",
        headers={
            "X-Domarion-User-Id": "enterprise-market-intel",
            "X-Domarion-Plan": "enterprise",
            "X-Domarion-Role": "admin",
        },
        params={"audience": "fund", "city": "Wrocław", "area_limit": 2},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["audience"] == "fund"
    assert payload["city"] == "Wrocław"
    assert payload["executive_summary"].startswith("Fund view")
    assert payload["data_confidence"] in {"limited", "medium", "high"}
    assert len(payload["area_watchlist"]) == 2
    assert payload["dashboard"]["listings_count"] >= 3
    assert payload["area_comparison"]["sort"] == "growth"
    assert "raw HTML" in payload["source_notes"][2]
