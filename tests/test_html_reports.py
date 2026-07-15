from pathlib import Path

from fastapi.testclient import TestClient

from domarion.main import app
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import ReportBranding
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
    assert "Buyer decision report v1" in html
    assert "Investment" in html
    assert "Ипотека и бюджет покупки" in html
    assert "Ориентировочный платеж" in html
    assert "Вопросы продавцу" in html
    assert "Чеклист проверки перед оффером" in html
    assert "Застройщик и репутация" in html
    assert "Fabryczna Estate Partners" in html
    assert "księga wieczysta" in html
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


def test_render_object_report_html_includes_realtor_branding() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)
    report = build_object_report(
        analysis,
        "realtor",
        branding=ReportBranding(
            agency_name="Example Realty",
            agent_name="Anna Agent",
            agent_email="anna@example.com",
            logo_url="https://example.com/logo.png",
            primary_color="#123456",
            accent_color="#654321",
            footer_text="Prepared by Example Realty.",
            agency_disclaimer="Agency disclaimer for client review.",
        ),
    )

    html = render_object_report_html(report, analysis)

    assert "Example Realty" in html
    assert "Anna Agent" in html
    assert 'src="https://example.com/logo.png"' in html
    assert "--accent: #123456" in html
    assert "--risk: #654321" in html
    assert "Prepared by Example Realty." in html
    assert "Agency disclaimer for client review." in html
    assert "Клиентская аргументация цены" in html
    assert "Сравнение с аналогами" in html
    assert "Карта и локация для клиента" in html
    assert "openstreetmap.org" in html


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
    assert "Арендная доходность" in response.text
    assert "Сравнение с альтернативами" in response.text
    assert "Ликвидность и тезис роста" in response.text


def test_object_report_pdf_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/reports/object/wr-001.pdf?audience=buyer")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"] == (
        'attachment; filename="domarion-report-wr-001.pdf"'
    )
    assert response.content.startswith(b"%PDF-1.4")
    assert b"/Type /Catalog" in response.content


def test_object_report_uses_audience_templates() -> None:
    repository = InMemoryRealEstateRepository()
    listing = repository.get_listing("wr-001")
    assert listing is not None
    analysis = build_listing_analysis(repository, listing)

    buyer_report = build_object_report(analysis, "buyer")
    realtor_report = build_object_report(analysis, "realtor")
    investor_report = build_object_report(analysis, "investor")

    assert buyer_report.template_code == "buyer_object_report_v1"
    assert buyer_report.sections[0].title == "Краткое решение"
    assert buyer_report.sections[1].title == "Решение покупателя"
    buyer_section_titles = {section.title for section in buyer_report.sections}
    assert "Краткое решение" in buyer_section_titles
    assert "Ипотека и бюджет покупки" in buyer_section_titles
    assert "Вопросы продавцу" in buyer_section_titles
    assert "Чеклист проверки перед оффером" in buyer_section_titles
    assert "Застройщик и репутация" in buyer_section_titles
    assert "Арендная доходность" not in buyer_section_titles
    assert realtor_report.template_code == "realtor_client_report_v1"
    realtor_section_titles = {section.title for section in realtor_report.sections}
    assert "Ипотека и бюджет покупки" not in realtor_section_titles
    assert "Вопросы продавцу" not in realtor_section_titles
    assert "Чеклист проверки перед оффером" not in realtor_section_titles
    assert "Арендная доходность" not in realtor_section_titles
    assert "Клиентская аргументация цены" in realtor_section_titles
    assert "Сравнение с аналогами" in realtor_section_titles
    assert "Карта и локация для клиента" in realtor_section_titles
    assert realtor_report.sections[0].title == "Для клиента риелтора"
    assert investor_report.template_code == "investor_object_report_v1"
    investor_section_titles = {section.title for section in investor_report.sections}
    assert "Клиентская аргументация цены" not in investor_section_titles
    assert "Арендная доходность" in investor_section_titles
    assert "Сравнение с альтернативами" in investor_section_titles
    assert "Ликвидность и тезис роста" in investor_section_titles
    assert investor_report.sections[0].title == "Инвестиционная оценка"
