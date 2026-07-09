from pathlib import Path

from fastapi.testclient import TestClient

from domarion.main import app
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.services.report_generation import (
    generate_object_report_html,
    write_object_report_html,
)
from domarion.services.report_html import render_object_report_html
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis


def test_render_object_report_html_contains_printable_report() -> None:
    repository = InMemoryRealEstateRepository()
    html = generate_object_report_html(repository, "wr-001")

    assert "<!doctype html>" in html
    assert "Domarion Analytics" in html
    assert "Investment" in html
    assert "История цены" in html
    assert "Похожие объекты" in html
    assert "не финансовая" in html


def test_render_object_report_html_escapes_dynamic_fields() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-001")
    assert listing is not None

    unsafe_listing = listing.model_copy(update={"title": "<script>alert(1)</script>"})
    analysis = build_listing_analysis(repository, unsafe_listing)
    report = build_object_report(analysis, "buyer")

    html = render_object_report_html(report, analysis)

    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html


def test_write_object_report_html(tmp_path: Path) -> None:
    repository = InMemoryRealEstateRepository()
    output_path = tmp_path / "reports" / "wr-001.html"

    path = write_object_report_html(repository, "wr-001", output_path)

    assert path == output_path
    assert path.exists()
    assert "Domarion Analytics" in path.read_text(encoding="utf-8")


def test_object_report_html_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/reports/object/wr-001.html?audience=investor")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "Domarion Analytics" in response.text
    assert "Инвестиционная оценка" in response.text
