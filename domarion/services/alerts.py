from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    Alert,
    AlertCreate,
    AlertFilters,
    AlertPreview,
    ListingAnalysis,
    ObjectWatchCreate,
    ObjectWatchEvent,
    ObjectWatchTargetType,
    ObjectWatchTriggerType,
)
from domarion.services.building_filters import matches_building_filters
from domarion.services.lifestyle_filters import matches_lifestyle_filters
from domarion.services.listing_text_search import listing_matches_query
from domarion.services.scoring import build_listing_analysis

DEFAULT_OBJECT_WATCH_TRIGGERS: tuple[ObjectWatchTriggerType, ...] = (
    "price_change",
    "cheaper_comparable",
    "days_on_market_threshold",
    "planned_investment_status",
    "developer_signal",
    "negotiation_opportunity",
)
DEFAULT_OBJECT_WATCH_DOM_THRESHOLDS = (120, 150)
DEFAULT_CHEAPER_COMPARABLE_DISCOUNT_PCT = 3.0


def build_alert_preview(
    repository: RealEstateRepository,
    alert: Alert,
    limit: int = 10,
) -> AlertPreview:
    if is_object_watch_alert(alert):
        return build_object_watch_preview(repository, alert, limit=limit)

    analyses = find_alert_matches(repository, alert.filters)
    return AlertPreview(
        alert=alert,
        matches=analyses[:limit],
        total_matches=len(analyses),
        applied_filters=alert.filters.model_dump(exclude_none=True),
    )


def is_object_watch_alert(alert: Alert) -> bool:
    return alert.filters.alert_kind == "object_watch" or bool(
        alert.filters.target_listing_id or alert.filters.target_draft_id
    )


def build_object_watch_alert_create(
    analysis: ListingAnalysis,
    request: ObjectWatchCreate | None = None,
    *,
    target_type: ObjectWatchTargetType = "listing",
    target_draft_id: str | None = None,
) -> AlertCreate:
    payload = request or ObjectWatchCreate()
    listing = analysis.listing
    buyer_decision = analysis.buyer_decision
    max_reasonable_offer = (
        buyer_decision.verdict.max_reasonable_offer_pln if buyer_decision is not None else None
    )
    planned_statuses = _planned_investment_statuses(analysis)
    developer_reputation = analysis.developer_reputation

    filters = AlertFilters(
        alert_kind="object_watch",
        city=listing.city,
        district=listing.district,
        municipality=listing.municipality,
        rooms=listing.rooms,
        min_area_m2=round(listing.area_m2 * 0.75, 1),
        target_type=target_type,
        target_listing_id=listing.id,
        target_draft_id=target_draft_id,
        object_watch_triggers=payload.triggers or list(DEFAULT_OBJECT_WATCH_TRIGGERS),
        baseline_price=listing.price,
        baseline_days_on_market=listing.days_on_market,
        baseline_price_reductions=listing.price_reductions,
        baseline_negotiation_score=analysis.scores.negotiation_score,
        baseline_max_reasonable_offer=max_reasonable_offer,
        baseline_planned_investment_statuses=planned_statuses or None,
        baseline_developer_reputation_score=(
            developer_reputation.reputation_score if developer_reputation is not None else None
        ),
        baseline_developer_risk_signal_count=(
            len(developer_reputation.risk_signals) if developer_reputation is not None else None
        ),
        days_on_market_thresholds=list(DEFAULT_OBJECT_WATCH_DOM_THRESHOLDS),
        min_cheaper_comparable_discount_pct=DEFAULT_CHEAPER_COMPARABLE_DISCOUNT_PCT,
    )
    return AlertCreate(
        name=payload.name or _default_object_watch_name(analysis, target_type),
        filters=filters,
        channel=payload.channel,
        frequency=payload.frequency,
        delivery_target=payload.delivery_target,
    )


def build_object_watch_preview(
    repository: RealEstateRepository,
    alert: Alert,
    limit: int = 10,
) -> AlertPreview:
    filters = alert.filters
    target_analysis = _target_listing_analysis(repository, filters)
    events: list[ObjectWatchEvent] = []
    matches: list[ListingAnalysis] = []

    if target_analysis is not None:
        events = _listing_object_watch_events(target_analysis, filters)
        matches.append(target_analysis)
    elif filters.target_type == "user_submitted_draft":
        events = _draft_object_watch_events(repository, filters)
    else:
        events.append(
            ObjectWatchEvent(
                trigger_type="price_change",
                severity="risk",
                title="Watched object is unavailable",
                summary="The target listing is no longer available in the current repository.",
                metadata={"target_listing_id": filters.target_listing_id},
            )
        )

    related_ids = [
        event.related_listing_id
        for event in events
        if event.related_listing_id and event.related_listing_id != filters.target_listing_id
    ]
    for listing_id in related_ids:
        if len(matches) >= limit:
            break
        if any(item.listing.id == listing_id for item in matches):
            continue
        listing = repository.get_listing(listing_id)
        if listing is not None:
            matches.append(
                build_listing_analysis(repository, listing, use_relevant_comparables=False)
            )

    if not matches and filters.target_type == "user_submitted_draft":
        matches = _draft_comparable_matches(repository, filters, limit)

    return AlertPreview(
        alert=alert,
        matches=matches[:limit],
        total_matches=len(events),
        applied_filters=filters.model_dump(exclude_none=True),
        watch_events=events[:limit],
    )


def find_alert_matches(
    repository: RealEstateRepository,
    filters: AlertFilters,
) -> list[ListingAnalysis]:
    if filters.alert_kind == "object_watch":
        return build_object_watch_preview(
            repository,
            Alert(
                id="object-watch-preview",
                owner_id="system",
                name="Object Watch",
                filters=filters,
                channel="email",
                frequency="daily",
                is_active=True,
                created_at=_epoch_datetime(),
                updated_at=_epoch_datetime(),
            ),
        ).matches

    listings = repository.list_listings(
        voivodeship=filters.voivodeship,
        city=filters.city,
        district=filters.district,
        municipality=filters.municipality,
        query=filters.query,
        rooms=filters.rooms,
        max_price=filters.max_price,
        min_area_m2=filters.min_area_m2,
    )
    listings = [listing for listing in listings if listing_matches_query(listing, filters.query)]
    listings = [
        listing
        for listing in listings
        if matches_building_filters(
            listing,
            building_type=filters.building_type,
            renovation_state=filters.renovation_state,
            min_floor=filters.min_floor,
            max_floor=filters.max_floor,
            max_building_floors=filters.max_building_floors,
            min_building_year=filters.min_building_year,
            max_building_year=filters.max_building_year,
        )
    ]
    listings = [
        listing
        for listing in listings
        if matches_lifestyle_filters(
            listing,
            has_balcony=filters.has_balcony,
            has_terrace=filters.has_terrace,
            has_garden=filters.has_garden,
            has_elevator=filters.has_elevator,
            parking_type=filters.parking_type,
            heating_type=filters.heating_type,
        )
    ]

    analyses = [
        build_listing_analysis(repository, listing, use_relevant_comparables=False)
        for listing in listings
    ]

    if filters.min_investment_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.investment_score >= filters.min_investment_score
        ]
    if filters.max_risk_score is not None:
        analyses = [item for item in analyses if item.scores.risk_score <= filters.max_risk_score]
    if filters.max_price_delta_to_fair_mid_pct is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.price_delta_to_fair_mid_pct <= filters.max_price_delta_to_fair_mid_pct
        ]
    if filters.min_negotiation_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.negotiation_score >= filters.min_negotiation_score
        ]
    if filters.min_liquidity_score is not None:
        analyses = [
            item for item in analyses if item.scores.liquidity_score >= filters.min_liquidity_score
        ]
    if filters.min_rental_potential_score is not None:
        analyses = [
            item
            for item in analyses
            if item.scores.rental_potential_score >= filters.min_rental_potential_score
        ]
    if filters.min_price_reductions is not None:
        analyses = [
            item
            for item in analyses
            if item.listing.price_reductions >= filters.min_price_reductions
        ]
    if filters.max_days_on_market is not None:
        analyses = [
            item for item in analyses if item.listing.days_on_market <= filters.max_days_on_market
        ]

    return sorted(
        analyses,
        key=lambda item: _alert_sort_key(item, filters),
    )


def _alert_sort_key(analysis: ListingAnalysis, filters: AlertFilters) -> tuple:
    scores = analysis.scores
    listing = analysis.listing
    if _has_advanced_investor_filters(filters):
        return (
            scores.price_delta_to_fair_mid_pct,
            -listing.price_reductions,
            -scores.rental_potential_score,
            -scores.liquidity_score,
            -scores.negotiation_score,
            -scores.investment_score,
            scores.risk_score,
            listing.price,
        )
    return (
        -scores.investment_score,
        scores.risk_score,
        listing.price,
    )


def _has_advanced_investor_filters(filters: AlertFilters) -> bool:
    return any(
        value is not None
        for value in (
            filters.max_price_delta_to_fair_mid_pct,
            filters.min_negotiation_score,
            filters.min_liquidity_score,
            filters.min_rental_potential_score,
            filters.min_price_reductions,
            filters.max_days_on_market,
        )
    )


def _listing_object_watch_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    triggers = _object_watch_triggers(filters)
    events: list[ObjectWatchEvent] = []

    if "price_change" in triggers:
        events.extend(_price_change_events(analysis, filters))
    if "cheaper_comparable" in triggers:
        events.extend(_cheaper_comparable_events(analysis, filters))
    if "days_on_market_threshold" in triggers:
        events.extend(_days_on_market_events(analysis, filters))
    if "planned_investment_status" in triggers:
        events.extend(_planned_investment_events(analysis, filters))
    if "developer_signal" in triggers:
        events.extend(_developer_signal_events(analysis, filters))
    if "negotiation_opportunity" in triggers:
        events.extend(_negotiation_opportunity_events(analysis, filters))

    if not events:
        events.append(
            ObjectWatchEvent(
                trigger_type="negotiation_opportunity",
                severity="info",
                listing_id=analysis.listing.id,
                title="No object-watch trigger fired",
                summary="Current data does not cross the saved object-watch thresholds.",
                metadata={"target_listing_id": analysis.listing.id},
            )
        )
    return events


def _price_change_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    listing = analysis.listing
    baseline_price = filters.baseline_price
    if baseline_price is None or listing.price == baseline_price:
        return []

    delta = listing.price - baseline_price
    direction = "down" if delta < 0 else "up"
    return [
        ObjectWatchEvent(
            trigger_type="price_change",
            severity="opportunity" if delta < 0 else "risk",
            listing_id=listing.id,
            title="Watched listing price changed",
            summary=(
                f"Price moved {direction} by {_money(abs(delta))} "
                f"({_pct(delta, baseline_price)} from baseline)."
            ),
            baseline_value=_money(baseline_price),
            current_value=_money(listing.price),
            metadata={
                "delta_pln": delta,
                "delta_pct": round(delta / baseline_price * 100, 2),
            },
        )
    ]


def _cheaper_comparable_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    listing = analysis.listing
    min_discount_pct = filters.min_cheaper_comparable_discount_pct
    if min_discount_pct is None:
        min_discount_pct = DEFAULT_CHEAPER_COMPARABLE_DISCOUNT_PCT
    price_threshold = round(listing.price * (1 - min_discount_pct / 100))
    max_offer = filters.baseline_max_reasonable_offer
    if max_offer is not None:
        price_threshold = min(price_threshold, max_offer)

    events: list[ObjectWatchEvent] = []
    for comparable in analysis.comparables:
        if comparable.price > price_threshold:
            continue
        discount_pct = (listing.price - comparable.price) / listing.price * 100
        events.append(
            ObjectWatchEvent(
                trigger_type="cheaper_comparable",
                severity="opportunity",
                listing_id=listing.id,
                related_listing_id=comparable.id,
                title="Cheaper comparable is available",
                summary=(
                    f"{comparable.title} is {_money(listing.price - comparable.price)} cheaper "
                    f"than the watched object ({round(discount_pct, 1)}%)."
                ),
                baseline_value=_money(listing.price),
                current_value=_money(comparable.price),
                metadata={
                    "comparable_listing_id": comparable.id,
                    "discount_pln": listing.price - comparable.price,
                    "discount_pct": round(discount_pct, 2),
                },
            )
        )
    return events


def _days_on_market_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    listing = analysis.listing
    baseline_days = filters.baseline_days_on_market or 0
    events: list[ObjectWatchEvent] = []
    for threshold in _days_on_market_thresholds(filters):
        if listing.days_on_market < threshold:
            continue
        crossed_after_baseline = baseline_days < threshold
        events.append(
            ObjectWatchEvent(
                trigger_type="days_on_market_threshold",
                severity="opportunity" if crossed_after_baseline else "watch",
                listing_id=listing.id,
                title=f"Days on market crossed {threshold}",
                summary=(
                    f"Watched object is now at {listing.days_on_market} days on market; "
                    "use exposure as negotiation context."
                ),
                baseline_value=f"{baseline_days} days",
                current_value=f"{listing.days_on_market} days",
                metadata={
                    "threshold_days": threshold,
                    "crossed_after_baseline": crossed_after_baseline,
                },
            )
        )
    return events


def _planned_investment_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    current_statuses = _planned_investment_statuses(analysis)
    baseline_statuses = filters.baseline_planned_investment_statuses or {}
    events: list[ObjectWatchEvent] = []
    for investment_id, status in current_statuses.items():
        previous = baseline_statuses.get(investment_id)
        if previous is not None and previous == status:
            continue
        nearest = (
            next(
                (
                    item
                    for item in analysis.future_area_impact.nearest_investments
                    if item.investment.id == investment_id
                ),
                None,
            )
            if analysis.future_area_impact is not None
            else None
        )
        name = nearest.investment.name if nearest is not None else investment_id
        events.append(
            ObjectWatchEvent(
                trigger_type="planned_investment_status",
                severity="watch",
                listing_id=analysis.listing.id,
                title="Nearby planned-investment signal changed",
                summary=f"{name} status is now {status}.",
                baseline_value=previous,
                current_value=status,
                metadata={"planned_investment_id": investment_id},
            )
        )
    return events


def _developer_signal_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    reputation = analysis.developer_reputation
    if reputation is None:
        return []

    baseline_score = filters.baseline_developer_reputation_score
    baseline_risk_count = filters.baseline_developer_risk_signal_count
    risk_count = len(reputation.risk_signals)
    events: list[ObjectWatchEvent] = []
    if baseline_score is not None and reputation.reputation_score != baseline_score:
        delta = reputation.reputation_score - baseline_score
        events.append(
            ObjectWatchEvent(
                trigger_type="developer_signal",
                severity="opportunity" if delta > 0 else "risk",
                listing_id=analysis.listing.id,
                title="Developer reputation score changed",
                summary=(
                    f"{reputation.developer.name} moved from {baseline_score}/100 "
                    f"to {reputation.reputation_score}/100."
                ),
                baseline_value=f"{baseline_score}/100",
                current_value=f"{reputation.reputation_score}/100",
                metadata={"developer_id": reputation.developer.id, "delta": delta},
            )
        )
    if baseline_risk_count is not None and risk_count > baseline_risk_count:
        events.append(
            ObjectWatchEvent(
                trigger_type="developer_signal",
                severity="risk",
                listing_id=analysis.listing.id,
                title="New developer risk signal",
                summary=(
                    f"{reputation.developer.name} now has {risk_count} risk signals "
                    f"versus {baseline_risk_count} at watch creation."
                ),
                baseline_value=str(baseline_risk_count),
                current_value=str(risk_count),
                metadata={"developer_id": reputation.developer.id},
            )
        )
    return events


def _negotiation_opportunity_events(
    analysis: ListingAnalysis,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    listing = analysis.listing
    baseline_score = filters.baseline_negotiation_score
    max_offer = filters.baseline_max_reasonable_offer
    events: list[ObjectWatchEvent] = []

    if baseline_score is not None and analysis.scores.negotiation_score >= baseline_score + 8:
        events.append(
            ObjectWatchEvent(
                trigger_type="negotiation_opportunity",
                severity="opportunity",
                listing_id=listing.id,
                title="Negotiation score improved",
                summary=(
                    f"Negotiation score is now {analysis.scores.negotiation_score}/100 "
                    f"versus {baseline_score}/100 at watch creation."
                ),
                baseline_value=f"{baseline_score}/100",
                current_value=f"{analysis.scores.negotiation_score}/100",
                metadata={"score_delta": analysis.scores.negotiation_score - baseline_score},
            )
        )
    if max_offer is not None and listing.price <= max_offer:
        events.append(
            ObjectWatchEvent(
                trigger_type="negotiation_opportunity",
                severity="opportunity",
                listing_id=listing.id,
                title="Asking price is within saved offer ceiling",
                summary=(
                    f"Current asking price {_money(listing.price)} is at or below "
                    f"the saved max reasonable offer {_money(max_offer)}."
                ),
                baseline_value=_money(max_offer),
                current_value=_money(listing.price),
                metadata={"max_reasonable_offer_pln": max_offer},
            )
        )
    if (
        filters.baseline_price_reductions is not None
        and listing.price_reductions > filters.baseline_price_reductions
    ):
        events.append(
            ObjectWatchEvent(
                trigger_type="negotiation_opportunity",
                severity="opportunity",
                listing_id=listing.id,
                title="New price reduction supports negotiation",
                summary=(
                    f"Price reductions increased from {filters.baseline_price_reductions} "
                    f"to {listing.price_reductions}."
                ),
                baseline_value=str(filters.baseline_price_reductions),
                current_value=str(listing.price_reductions),
                metadata={"price_reductions": listing.price_reductions},
            )
        )
    return events


def _draft_object_watch_events(
    repository: RealEstateRepository,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    triggers = _object_watch_triggers(filters)
    events: list[ObjectWatchEvent] = []
    if "cheaper_comparable" in triggers:
        events.extend(_draft_cheaper_comparable_events(repository, filters))
    if "price_change" in triggers:
        events.append(
            ObjectWatchEvent(
                trigger_type="price_change",
                severity="info",
                listing_id=filters.target_listing_id,
                title="Private draft source is not crawled",
                summary=(
                    "This watch tracks legal-first marketplace, infrastructure and developer "
                    "signals; it does not re-crawl a private user-submitted portal URL."
                ),
                metadata={"target_draft_id": filters.target_draft_id},
            )
        )
    return events


def _draft_cheaper_comparable_events(
    repository: RealEstateRepository,
    filters: AlertFilters,
) -> list[ObjectWatchEvent]:
    baseline_price = filters.baseline_price
    if baseline_price is None:
        return []

    discount_pct = filters.min_cheaper_comparable_discount_pct
    if discount_pct is None:
        discount_pct = DEFAULT_CHEAPER_COMPARABLE_DISCOUNT_PCT
    threshold = round(baseline_price * (1 - discount_pct / 100))
    if filters.baseline_max_reasonable_offer is not None:
        threshold = min(threshold, filters.baseline_max_reasonable_offer)

    events: list[ObjectWatchEvent] = []
    for analysis in _draft_comparable_matches(repository, filters, limit=10):
        comparable = analysis.listing
        if comparable.price > threshold:
            continue
        discount_pln = baseline_price - comparable.price
        events.append(
            ObjectWatchEvent(
                trigger_type="cheaper_comparable",
                severity="opportunity",
                listing_id=filters.target_listing_id,
                related_listing_id=comparable.id,
                title="Cheaper comparable is available",
                summary=(
                    f"{comparable.title} is {_money(discount_pln)} cheaper "
                    "than the watched private draft."
                ),
                baseline_value=_money(baseline_price),
                current_value=_money(comparable.price),
                metadata={
                    "target_draft_id": filters.target_draft_id,
                    "discount_pln": discount_pln,
                },
            )
        )
    return events


def _draft_comparable_matches(
    repository: RealEstateRepository,
    filters: AlertFilters,
    limit: int,
) -> list[ListingAnalysis]:
    listings = repository.list_listings(
        city=filters.city,
        district=filters.district,
        municipality=filters.municipality,
        rooms=filters.rooms,
        max_price=filters.baseline_price,
        min_area_m2=filters.min_area_m2,
    )
    analyses = [
        build_listing_analysis(repository, listing, use_relevant_comparables=False)
        for listing in listings
    ]
    return sorted(
        analyses,
        key=lambda item: (
            item.listing.price,
            item.scores.risk_score,
            -item.scores.negotiation_score,
        ),
    )[:limit]


def _target_listing_analysis(
    repository: RealEstateRepository,
    filters: AlertFilters,
) -> ListingAnalysis | None:
    if not filters.target_listing_id:
        return None
    listing = repository.get_listing(filters.target_listing_id)
    if listing is None:
        return None
    return build_listing_analysis(repository, listing, use_relevant_comparables=False)


def _object_watch_triggers(filters: AlertFilters) -> list[ObjectWatchTriggerType]:
    return filters.object_watch_triggers or list(DEFAULT_OBJECT_WATCH_TRIGGERS)


def _days_on_market_thresholds(filters: AlertFilters) -> list[int]:
    return filters.days_on_market_thresholds or list(DEFAULT_OBJECT_WATCH_DOM_THRESHOLDS)


def _planned_investment_statuses(analysis: ListingAnalysis) -> dict[str, str]:
    impact = analysis.future_area_impact
    if impact is None:
        return {}
    return {item.investment.id: item.investment.status for item in impact.nearest_investments[:10]}


def _default_object_watch_name(
    analysis: ListingAnalysis,
    target_type: ObjectWatchTargetType,
) -> str:
    prefix = "Object Watch" if target_type == "listing" else "Draft Watch"
    return f"{prefix}: {analysis.listing.address}"


def _money(value: int) -> str:
    return f"{value:,} PLN".replace(",", " ")


def _pct(delta: int, baseline: int) -> str:
    return f"{round(delta / baseline * 100, 1)}%"


def _epoch_datetime():
    from datetime import UTC, datetime

    return datetime.fromtimestamp(0, UTC)
