import json
from pathlib import Path

from domarion.report_store.base import ReportStore
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    GeneratedReport,
    GeneratedReportCreate,
    MarketDashboardArea,
    ReportAudience,
    ReportBranding,
    ReportFormat,
    UserSubmittedListingAnalysis,
    UserSubmittedListingDraft,
)
from domarion.services.market_dashboard import build_market_dashboard
from domarion.services.report_html import render_area_report_html, render_object_report_html
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


def generate_and_store_user_submitted_draft_report(
    report_store: ReportStore,
    draft: UserSubmittedListingDraft,
    audience: ReportAudience = "buyer",
    report_format: ReportFormat = "html",
    owner_id: str = "demo-user",
    branding: ReportBranding | None = None,
) -> GeneratedReport:
    analysis_wrapper = UserSubmittedListingAnalysis.model_validate(draft.analysis_payload)
    analysis = analysis_wrapper.analysis
    listing = analysis.listing
    report = build_object_report(analysis, audience, branding=branding)

    if report_format == "html":
        content = render_object_report_html(report, analysis)
        content_type = "text/html; charset=utf-8"
    else:
        content = report.model_dump_json(indent=2)
        content_type = "application/json"

    payload = GeneratedReportCreate(
        owner_id=owner_id,
        listing_id=listing.id,
        audience=audience,
        report_format=report_format,
        content_type=content_type,
        title=listing.title,
        summary=report.summary,
        content=content,
        report_metadata={
            "user_submitted_draft_id": draft.id,
            "source_domain": draft.source_domain,
            "private_source_reference_present": draft.source_url_private is not None,
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


def generate_and_store_area_report(
    repository: RealEstateRepository,
    report_store: ReportStore,
    area_id: str,
    audience: ReportAudience = "realtor",
    report_format: ReportFormat = "html",
    owner_id: str = "demo-user",
) -> GeneratedReport:
    area = repository.get_area_statistics(area_id)
    if area is None:
        raise ReportGenerationError(f"Area not found: {area_id}")

    dashboard = build_market_dashboard(repository, city=area.city, district=area.name)
    market_area = _dashboard_area_for_report(area.area_id, dashboard.areas)
    summary = _build_area_report_summary(area.name, area.city, market_area)

    if report_format == "html":
        content = render_area_report_html(area, dashboard, summary)
        content_type = "text/html; charset=utf-8"
    else:
        content = json.dumps(
            {
                "template_code": "area_market_report_v1",
                "area": area.model_dump(),
                "market_dashboard": dashboard.model_dump(),
                "summary": summary,
                "disclaimer": _area_report_disclaimer(),
            },
            ensure_ascii=False,
            indent=2,
        )
        content_type = "application/json"

    payload = GeneratedReportCreate(
        owner_id=owner_id,
        listing_id=f"area:{area.area_id}",
        audience=audience,
        report_format=report_format,
        content_type=content_type,
        title=f"{area.name}, {area.city} - Area Market Report",
        summary=summary,
        content=content,
        report_metadata={
            "area_id": area.area_id,
            "city": area.city,
            "district": area.name,
            "report_template_code": "area_market_report_v1",
            "report_template_name": "Area Market Report v1",
            "median_price_per_m2": area.median_price_per_m2,
            "average_price_per_m2": area.average_price_per_m2,
            "active_listings": area.active_listings,
            "price_change_90d_pct": area.price_change_90d_pct,
            "supply_change_90d_pct": area.supply_change_90d_pct,
            "liquidity_index": market_area.liquidity_index if market_area else None,
            "buyer_market_index": market_area.buyer_market_index if market_area else None,
            "seller_market_index": market_area.seller_market_index if market_area else None,
            "overheated_index": market_area.overheated_index if market_area else None,
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


def _dashboard_area_for_report(
    area_id: str,
    dashboard_areas: list[MarketDashboardArea],
) -> MarketDashboardArea | None:
    for area in dashboard_areas:
        if area.area_id == area_id:
            return area
    return None


def _build_area_report_summary(
    area_name: str,
    city: str,
    market_area: MarketDashboardArea | None,
) -> str:
    if market_area is None:
        return f"{area_name}, {city}: insufficient area index data for a full paid market signal."

    return (
        f"{area_name}, {city}: median price is "
        f"{_format_int(market_area.median_price_per_m2)} PLN/m2, active supply is "
        f"{market_area.active_listings} listings, liquidity index is "
        f"{market_area.liquidity_index}/100 and buyer market index is "
        f"{market_area.buyer_market_index}/100."
    )


def _area_report_disclaimer() -> str:
    return (
        "Analytical market context only. Validate legal, technical, financing and tax facts "
        "before making a transaction or investment decision."
    )


def _format_int(value: int) -> str:
    return f"{value:,}".replace(",", " ")
