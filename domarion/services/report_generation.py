import json
from html import escape
from pathlib import Path

from domarion.report_store.base import ReportStore
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    GeneratedReport,
    GeneratedReportCreate,
    ListingAnalysis,
    MarketDashboardArea,
    ObjectReport,
    ReportAudience,
    ReportBranding,
    ReportFormat,
    ReportProductCode,
    ReportSection,
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
    product_code: ReportProductCode = "object_report",
    report_metadata_extra: dict | None = None,
) -> GeneratedReport:
    listing = repository.get_listing(listing_id)
    if listing is None:
        raise ReportGenerationError(f"Listing not found: {listing_id}")

    analysis = build_listing_analysis(repository, listing)
    report = build_object_report(analysis, audience, branding=branding)
    report = _apply_paid_object_report_variant(report, analysis, product_code)

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
        title=_object_report_title(listing.title, product_code),
        summary=report.summary,
        content=content,
        report_metadata={
            "report_product_code": product_code,
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
            **(report_metadata_extra or {}),
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
    product_code: ReportProductCode = "object_report",
    report_metadata_extra: dict | None = None,
) -> GeneratedReport:
    analysis_wrapper = UserSubmittedListingAnalysis.model_validate(draft.analysis_payload)
    analysis = analysis_wrapper.analysis
    listing = analysis.listing
    report = build_object_report(analysis, audience, branding=branding)
    report = _apply_paid_object_report_variant(report, analysis, product_code)

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
        title=_object_report_title(listing.title, product_code),
        summary=report.summary,
        content=content,
        report_metadata={
            "report_product_code": product_code,
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
            **(report_metadata_extra or {}),
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
    report_metadata_extra: dict | None = None,
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
            **(report_metadata_extra or {}),
        },
    )
    return report_store.save_report(payload)


def generate_and_store_report_bundle_receipt(
    report_store: ReportStore,
    owner_id: str,
    order_id: str,
    credits: int,
    report_format: ReportFormat = "html",
) -> GeneratedReport:
    title = f"{credits} Report Credits Bundle"
    summary = f"Paid bundle fulfilled: {credits} report credits granted to this account."
    metadata = {
        "report_product_code": "report_bundle_5",
        "report_bundle_receipt": True,
        "report_credits_granted": credits,
        "report_credit_bundle_order_id": order_id,
    }

    if report_format == "json":
        content = json.dumps(
            {
                "template_code": "report_bundle_receipt_v1",
                "order_id": order_id,
                "credits_granted": credits,
                "summary": summary,
            },
            ensure_ascii=False,
            indent=2,
        )
        content_type = "application/json"
    else:
        content = _render_report_bundle_receipt_html(order_id, credits, summary)
        content_type = "text/html; charset=utf-8"

    payload = GeneratedReportCreate(
        owner_id=owner_id,
        listing_id="bundle:reports-5",
        audience="buyer",
        report_format=report_format,
        content_type=content_type,
        title=title,
        summary=summary,
        content=content,
        report_metadata=metadata,
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


def _render_report_bundle_receipt_html(order_id: str, credits: int, summary: str) -> str:
    return f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{credits} Report Credits Bundle</title>
  <style>
    body {{ margin: 0; background: #eef2f5; color: #17202a; font: 14px/1.5 Arial, sans-serif; }}
    main {{
      width: min(760px, calc(100% - 32px));
      margin: 24px auto;
      background: #fff;
      border: 1px solid #d9dee6;
      padding: 28px;
    }}
    h1 {{ margin: 0 0 10px; font-size: 26px; }}
    .summary {{
      border-left: 4px solid #0f766e;
      background: #f5f7fa;
      padding: 14px 16px;
      margin: 18px 0;
    }}
    .metric {{ border: 1px solid #d9dee6; padding: 12px; display: inline-block; min-width: 180px; }}
    .metric strong {{ display: block; font-size: 28px; color: #0f766e; }}
    .muted {{ color: #5f6b7a; }}
  </style>
</head>
<body>
  <main>
    <p class="muted">Domarion Analytics</p>
    <h1>{credits} Report Credits Bundle</h1>
    <p class="summary">{escape(summary)}</p>
    <div class="metric"><span>Credits granted</span><strong>{credits}</strong></div>
    <p class="muted">Order ID: {escape(order_id)}</p>
    <p class="muted">
      Credits are owner-scoped and consumed when reports are generated beyond the monthly
      plan limit.
    </p>
  </main>
</body>
</html>
"""


def _apply_paid_object_report_variant(
    report: ObjectReport,
    analysis: ListingAnalysis,
    product_code: ReportProductCode,
) -> ObjectReport:
    if product_code != "full_object_analysis":
        return report

    sections = [
        _full_analysis_summary_section(analysis),
        *report.sections,
        _full_analysis_due_diligence_section(analysis),
        _full_analysis_offer_strategy_section(analysis),
        _full_analysis_scenarios_section(analysis),
    ]
    return report.model_copy(
        update={
            "template_code": "full_object_analysis_v1",
            "template_name": "Full Object Analysis v1",
            "summary": f"Full Object Analysis: {report.summary}",
            "sections": sections,
        }
    )


def _object_report_title(listing_title: str, product_code: ReportProductCode) -> str:
    if product_code == "full_object_analysis":
        return f"Full Object Analysis - {listing_title}"
    if product_code == "investor_report":
        return f"Investor Report - {listing_title}"
    return listing_title


def _full_analysis_summary_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    scores = analysis.scores
    return ReportSection(
        title="Full Object Analysis Summary",
        items=[
            f"Listing: {listing.address}, {listing.district}, {listing.city}.",
            f"Fair price range: {_money_range(scores.fair_price_low, scores.fair_price_high)}.",
            f"Price delta to fair mid: {scores.price_delta_to_fair_mid_pct:+.1f}%.",
            f"Fair price confidence: {scores.fair_price_confidence_score}/100.",
            (
                "Decision posture: "
                f"{_decision_posture(scores.risk_score, scores.negotiation_score)}."
            ),
        ],
    )


def _full_analysis_due_diligence_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    items = [
        "Validate księga wieczysta: owner, mortgage, claims, easements and land use.",
        "Compare usable area, floor, storage, parking and included fixtures against documents.",
        "Request building/community documents: fees, renovation fund, planned repairs and debts.",
        "Check technical state: windows, electrical, plumbing, heating, ventilation and moisture.",
        (
            f"Location checks: stop {listing.nearest_stop_m} m, "
            f"school {listing.nearest_school_m} m, "
            f"major road {listing.nearest_major_road_m} m, industrial zone "
            f"{listing.nearest_industrial_zone_m} m."
        ),
    ]
    if listing.market_type == "primary":
        items.append("Primary market: check developer escrow, handover date and prospekt.")
    else:
        items.append("Secondary market: include PCC 2%, notary costs and building repair reserves.")
    if analysis.scores.risk_score >= 60:
        items.append("Risk Score is elevated; require extra evidence or price discount.")
    return ReportSection(title="Due diligence deep dive", items=items)


def _full_analysis_offer_strategy_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    scores = analysis.scores
    opening_offer = _opening_offer(listing.price, scores.price_delta_to_fair_mid_pct)
    walkaway = min(scores.fair_price_high, round(listing.price * 1.01))
    items = [
        f"Suggested opening anchor: {_money(opening_offer)}.",
        f"Walk-away guardrail before extra due diligence: {_money(walkaway)}.",
        f"Use fair price confidence {scores.fair_price_confidence_score}/100 to size discount.",
        f"Negotiation Score: {scores.negotiation_score}/100.",
        *analysis.negotiation_arguments[:4],
    ]
    if listing.days_on_market > analysis.area_statistics.average_days_on_market:
        items.append(
            "Days on market is above area average; use exposure as a negotiation argument."
        )
    if listing.price_reductions:
        items.append(f"Price was already reduced {listing.price_reductions} time(s).")
    return ReportSection(title="Offer and negotiation plan", items=items)


def _full_analysis_scenarios_section(analysis: ListingAnalysis) -> ReportSection:
    listing = analysis.listing
    scores = analysis.scores
    area = analysis.area_statistics
    return ReportSection(
        title="Scenario matrix",
        items=[
            (
                "Conservative: negotiate near "
                f"{_money(scores.fair_price_low)} if legal/technical checks reveal issues."
            ),
            (
                f"Base case: fair mid {_money(scores.fair_price_mid)} with "
                f"{scores.fair_price_confidence_score}/100 confidence."
            ),
            (
                "Upside case: paying toward "
                f"{_money(scores.fair_price_high)} needs clean due diligence and strong demand."
            ),
            (
                f"Area trend context: price 90d {area.price_change_90d_pct:+.1f}%, "
                f"supply 90d {area.supply_change_90d_pct:+.1f}%."
            ),
            (
                f"Liquidity context: object {listing.days_on_market} days on market vs "
                f"area average {area.average_days_on_market}."
            ),
        ],
    )


def _decision_posture(risk_score: int, negotiation_score: int) -> str:
    if risk_score >= 70:
        return "high scrutiny before offer"
    if negotiation_score >= 65:
        return "negotiation-friendly"
    if risk_score <= 35:
        return "standard diligence"
    return "balanced, verify object-specific facts"


def _opening_offer(price: int, price_delta_pct: float) -> int:
    if price_delta_pct > 7:
        return round(price * 0.93)
    if price_delta_pct > 0:
        return round(price * 0.96)
    return round(price * 0.98)


def _money(value: int) -> str:
    return f"{_format_int(value)} PLN"


def _money_range(low: int, high: int) -> str:
    return f"{_money(low)}-{_money(high)}"
