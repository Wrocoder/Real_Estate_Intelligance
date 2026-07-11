from pathlib import Path

from domarion.report_store.base import ReportStore
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    GeneratedReport,
    GeneratedReportCreate,
    ReportAudience,
    ReportBranding,
    ReportFormat,
)
from domarion.services.report_html import render_object_report_html
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis


class ReportGenerationError(ValueError):
    pass


def generate_object_report_html(
    repository: RealEstateRepository,
    listing_id: str,
    audience: ReportAudience = "buyer",
    branding: ReportBranding | None = None,
) -> str:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise ReportGenerationError(f"Listing not found: {listing_id}")

    analysis = build_listing_analysis(repository, listing)
    report = build_object_report(analysis, audience, branding=branding)
    return render_object_report_html(report, analysis)


def generate_and_store_object_report(
    repository: RealEstateRepository,
    report_store: ReportStore,
    listing_id: str,
    audience: ReportAudience = "buyer",
    report_format: ReportFormat = "html",
    owner_id: str = "demo-user",
    branding: ReportBranding | None = None,
) -> GeneratedReport:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise ReportGenerationError(f"Listing not found: {listing_id}")

    analysis = build_listing_analysis(repository, listing)
    report = build_object_report(analysis, audience, branding=branding)

    if report_format == "html":
        content = render_object_report_html(report, analysis)
        content_type = "text/html; charset=utf-8"
    else:
        content = report.model_dump_json(indent=2)
        content_type = "application/json"

    payload = GeneratedReportCreate(
        owner_id=owner_id,
        listing_id=listing_id,
        audience=audience,
        report_format=report_format,
        content_type=content_type,
        title=listing.title,
        summary=report.summary,
        content=content,
        report_metadata={
            "area_id": listing.area_id,
            "city": listing.city,
            "district": listing.district,
            "investment_score": analysis.scores.investment_score,
            "risk_score": analysis.scores.risk_score,
            "negotiation_score": analysis.scores.negotiation_score,
            "fair_price_confidence_score": analysis.scores.fair_price_confidence_score,
            "report_template_code": report.template_code,
            "report_template_name": report.template_name,
            "report_branding": (
                report.branding.model_dump(exclude_none=True) if report.branding else None
            ),
            "scoring_formula_version": analysis.scores.formula_version,
            "scoring_weights_profile": analysis.scores.weights_profile,
        },
    )
    return report_store.save_report(payload)


def write_object_report_html(
    repository: RealEstateRepository,
    listing_id: str,
    output_path: str | Path,
    audience: ReportAudience = "buyer",
    branding: ReportBranding | None = None,
) -> Path:
    html = generate_object_report_html(repository, listing_id, audience, branding=branding)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    return path
