from pathlib import Path

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import ReportAudience
from domarion.services.report_html import render_object_report_html
from domarion.services.reports import build_object_report
from domarion.services.scoring import build_listing_analysis


class ReportGenerationError(ValueError):
    pass


def generate_object_report_html(
    repository: RealEstateRepository,
    listing_id: str,
    audience: ReportAudience = "buyer",
) -> str:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise ReportGenerationError(f"Listing not found: {listing_id}")

    analysis = build_listing_analysis(repository, listing)
    report = build_object_report(analysis, audience)
    return render_object_report_html(report, analysis)


def write_object_report_html(
    repository: RealEstateRepository,
    listing_id: str,
    output_path: str | Path,
    audience: ReportAudience = "buyer",
) -> Path:
    html = generate_object_report_html(repository, listing_id, audience)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    return path

