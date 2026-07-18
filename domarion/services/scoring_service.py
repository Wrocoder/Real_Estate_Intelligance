import json
from datetime import UTC, datetime
from hashlib import sha256

from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Listing,
    ListingAnalysis,
    ScoringServiceAudience,
    ScoringServiceComparable,
    ScoringServiceRequest,
    ScoringServiceResult,
    ScoringServiceValuation,
    UserSubmittedListingRequest,
)
from domarion.services.user_submitted_listings import (
    COMPARABLES_BASIS,
    analyze_user_submitted_listing,
)

SCORING_SERVICE_DISCLAIMER = (
    "Scoring-as-a-service outputs are analytical screening signals based on caller-submitted "
    "fields, normalized listings, area statistics and open-data layers. They are not financial, "
    "legal, valuation, underwriting or investment advice and do not guarantee price, liquidity, "
    "financing, legal status or future performance."
)


def evaluate_scoring_service_listing(
    repository: RealEstateRepository,
    payload: ScoringServiceRequest,
) -> ScoringServiceResult:
    analysis_wrapper = analyze_user_submitted_listing(
        repository,
        _to_user_submitted_request(payload),
    )
    analysis = analysis_wrapper.analysis
    listing = analysis.listing
    scores = analysis.scores

    return ScoringServiceResult(
        request_id=_request_id(payload),
        generated_at=datetime.now(UTC),
        audience=payload.audience,
        persisted=False,
        input=payload,
        confidence_score=analysis_wrapper.confidence_score,
        scores=scores,
        valuation=ScoringServiceValuation(
            asking_price=listing.price,
            price_per_m2=listing.price_per_m2,
            fair_price_low=scores.fair_price_low,
            fair_price_mid=scores.fair_price_mid,
            fair_price_high=scores.fair_price_high,
            fair_price_confidence_score=scores.fair_price_confidence_score,
            price_delta_to_fair_mid_pct=scores.price_delta_to_fair_mid_pct,
        ),
        area_statistics=analysis.area_statistics,
        developer_reputation=analysis.developer_reputation,
        comparables=[
            _to_comparable(listing, comparable) for comparable in analysis.comparables[:5]
        ],
        decision_summary=_decision_summary(analysis),
        key_findings=_key_findings(analysis),
        risk_flags=_risk_flags(analysis, analysis_wrapper.warnings),
        recommended_actions=_recommended_actions(payload.audience, analysis),
        data_quality_notes=analysis.data_quality_notes,
        methodology_notes=[
            "Endpoint evaluates caller-submitted fields in memory and does not create a draft.",
            COMPARABLES_BASIS,
            "Source URLs, photos, contacts, full descriptions and raw HTML are not required.",
        ],
        disclaimer=SCORING_SERVICE_DISCLAIMER,
    )


def _to_user_submitted_request(payload: ScoringServiceRequest) -> UserSubmittedListingRequest:
    return UserSubmittedListingRequest(
        title=payload.title,
        source_url=None,
        developer_id=payload.developer_id,
        developer_name=payload.developer_name,
        investment_name=payload.investment_name,
        primary_market_project_id=payload.primary_market_project_id,
        address=payload.address,
        city=payload.city,
        district=payload.district,
        market_type=payload.market_type,
        price=payload.price,
        area_m2=payload.area_m2,
        rooms=payload.rooms,
        floor=payload.floor,
        building_floors=payload.building_floors,
        building_year=payload.building_year,
        lat=payload.lat,
        lon=payload.lon,
        distance_to_center_km=payload.distance_to_center_km,
        nearest_stop_m=payload.nearest_stop_m,
        nearest_school_m=payload.nearest_school_m,
        nearest_major_road_m=payload.nearest_major_road_m,
        nearest_industrial_zone_m=payload.nearest_industrial_zone_m,
        parks_within_1km=payload.parks_within_1km,
        schools_within_1km=payload.schools_within_1km,
        planned_investments_within_2km=payload.planned_investments_within_2km,
        confirm_private_analysis=True,
        save_private_draft=False,
        retention_days=1,
    )


def _to_comparable(subject: Listing, comparable: Listing) -> ScoringServiceComparable:
    return ScoringServiceComparable(
        listing_id=comparable.id,
        title=comparable.title,
        address=comparable.address,
        city=comparable.city,
        district=comparable.district,
        market_type=comparable.market_type,
        price=comparable.price,
        area_m2=comparable.area_m2,
        rooms=comparable.rooms,
        price_per_m2=comparable.price_per_m2,
        floor=comparable.floor,
        building_floors=comparable.building_floors,
        building_year=comparable.building_year,
        price_delta_to_subject_pct=_pct_delta(comparable.price, subject.price),
        price_per_m2_delta_to_subject_pct=_pct_delta(
            comparable.price_per_m2,
            subject.price_per_m2,
        ),
    )


def _decision_summary(analysis: ListingAnalysis) -> str:
    listing = analysis.listing
    scores = analysis.scores
    return (
        f"{listing.address}: {scores.decision_label} with investment "
        f"{scores.investment_score}/100, risk {scores.risk_score}/100 and fair mid "
        f"{scores.fair_price_mid} PLN. Asking price is "
        f"{scores.price_delta_to_fair_mid_pct:+.1f}% versus the model fair mid."
    )


def _key_findings(analysis: ListingAnalysis) -> list[str]:
    listing = analysis.listing
    area = analysis.area_statistics
    scores = analysis.scores
    findings = [
        (
            f"Price position: {listing.price} PLN at {listing.price_per_m2} PLN/m2 "
            f"versus fair range {scores.fair_price_low}-{scores.fair_price_high} PLN."
        ),
        (
            f"{area.name}, {area.city}: median {area.median_price_per_m2} PLN/m2, "
            f"{area.active_listings} active listings and {area.average_days_on_market} "
            "average days on market."
        ),
        (
            f"Liquidity {scores.liquidity_score}/100, negotiation "
            f"{scores.negotiation_score}/100 and rental potential "
            f"{scores.rental_potential_score}/100."
        ),
        f"Comparable listings used: {len(analysis.comparables)}.",
    ]
    if analysis.developer_reputation is not None:
        reputation = analysis.developer_reputation
        findings.append(
            f"Developer match: {reputation.developer.name}, reputation "
            f"{reputation.reputation_score}/100 and confidence "
            f"{reputation.confidence_score}/100."
        )
    return findings


def _risk_flags(analysis: ListingAnalysis, wrapper_warnings: list[str]) -> list[str]:
    flags = [
        *analysis.scores.warnings,
        *wrapper_warnings,
    ]
    if analysis.risk_profile is not None:
        flags.extend(
            factor.summary
            for factor in analysis.risk_profile.factors
            if factor.severity in {"high", "medium"}
        )
        flags.extend(analysis.risk_profile.missing_risk_layers)
    return _deduplicate(flags)[:10]


def _recommended_actions(
    audience: ScoringServiceAudience,
    analysis: ListingAnalysis,
) -> list[str]:
    actions = []
    if analysis.risk_profile is not None:
        actions.extend(analysis.risk_profile.priority_checks[:4])

    if audience == "buyer":
        actions.extend(
            [
                "Verify land and mortgage register, ownership, encumbrances and seller authority.",
                (
                    "Use fair range and risk flags before signing umowa przedwstępna "
                    "or paying zadatek."
                ),
            ]
        )
    elif audience == "realtor":
        actions.extend(
            [
                "Use the fair range and closest comparables to prepare client-facing pricing copy.",
                "Highlight data gaps that must be confirmed before a viewing or offer.",
            ]
        )
    elif audience == "underwriting":
        actions.extend(
            [
                "Route elevated risk, weak liquidity or low-confidence outputs to manual review.",
                "Cross-check collateral value against independent valuation and bank policy.",
            ]
        )
    elif audience == "developer":
        actions.extend(
            [
                "Compare object pricing against local supply, project pipeline and MPZP/Studium.",
                (
                    "Validate developer entity, project SPV, permits and escrow account "
                    "before reliance."
                ),
            ]
        )
    else:
        actions.extend(
            [
                "Validate rent, HOA, tax, capex and vacancy assumptions before underwriting yield.",
                "Use liquidity and negotiation scores to prioritize deeper diligence.",
            ]
        )
    return _deduplicate(actions)[:8]


def _request_id(payload: ScoringServiceRequest) -> str:
    serialized = json.dumps(
        payload.model_dump(mode="json"),
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    )
    return f"score-{sha256(serialized.encode('utf-8')).hexdigest()[:16]}"


def _pct_delta(value: int | float, baseline: int | float) -> float:
    if baseline == 0:
        return 0.0
    return round((value - baseline) / baseline * 100, 1)


def _deduplicate(items: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result
