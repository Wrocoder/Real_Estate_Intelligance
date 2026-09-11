from datetime import UTC, datetime, timedelta

from domarion.product_analytics_store.base import ProductAnalyticsStore
from domarion.schemas import (
    ProductEventCreate,
    ProductEventName,
    ProductFunnelStage,
    ProductFunnelSummary,
)

PRODUCT_EVENT_ORDER: tuple[ProductEventName, ...] = (
    "check_started",
    "check_completed",
    "verdict_viewed",
    "comparables_opened",
    "risk_opened",
    "negotiation_opened",
    "negotiation_message_generated",
    "property_saved",
    "comparison_started",
    "comparison_completed",
    "report_opened",
    "pricing_viewed",
    "checkout_started",
    "purchase_completed",
)

EVENT_PROPERTY_KEYS: dict[ProductEventName, frozenset[str]] = {
    "check_started": frozenset({"surface", "intent", "market_type", "entry_mode"}),
    "check_completed": frozenset(
        {"surface", "intent", "market_type", "result_state", "confidence_level"}
    ),
    "report_opened": frozenset({"surface", "report_type"}),
    "verdict_viewed": frozenset({"surface", "verdict", "confidence_level"}),
    "comparables_opened": frozenset({"surface", "evidence_state"}),
    "risk_opened": frozenset({"surface", "evidence_state"}),
    "negotiation_opened": frozenset({"surface", "evidence_state"}),
    "negotiation_message_generated": frozenset({"surface", "result_state"}),
    "property_saved": frozenset({"surface"}),
    "comparison_started": frozenset({"surface", "intent", "comparison_size"}),
    "comparison_completed": frozenset(
        {"surface", "intent", "comparison_size", "result_state"}
    ),
    "pricing_viewed": frozenset({"surface"}),
    "checkout_started": frozenset({"surface", "report_type", "payment_provider"}),
    "purchase_completed": frozenset({"surface", "report_type", "payment_provider"}),
}

PROPERTY_VALUES: dict[str, frozenset[str]] = {
    "surface": frozenset({"check", "listing", "reports", "compare", "pricing", "checkout"}),
    "intent": frozenset({"living", "investment", "unsure"}),
    "market_type": frozenset({"primary", "secondary"}),
    "entry_mode": frozenset({"url", "manual", "restored"}),
    "result_state": frozenset({"success", "partial", "insufficient", "error"}),
    "confidence_level": frozenset({"high", "medium", "low", "unknown"}),
    "verdict": frozenset({"buy", "negotiate", "skip", "unavailable"}),
    "evidence_state": frozenset({"available", "partial", "insufficient", "unknown"}),
    "report_type": frozenset({"buyer", "investor", "realtor"}),
    "payment_provider": frozenset({"stripe", "payu", "mock", "unknown"}),
}


def validate_product_event(payload: ProductEventCreate) -> None:
    allowed_keys = EVENT_PROPERTY_KEYS[payload.event_name]
    unexpected = set(payload.properties) - allowed_keys
    if unexpected:
        raise ValueError("unsupported product event properties")

    for key, value in payload.properties.items():
        if key == "comparison_size":
            if isinstance(value, bool) or not isinstance(value, int) or not 2 <= value <= 4:
                raise ValueError("comparison_size must be between 2 and 4")
            continue
        if not isinstance(value, str) or value not in PROPERTY_VALUES[key]:
            raise ValueError(f"unsupported value for {key}")


def build_product_funnel_summary(
    store: ProductAnalyticsStore,
    *,
    window_days: int,
    now: datetime | None = None,
) -> ProductFunnelSummary:
    generated_at = now or datetime.now(UTC)
    since = generated_at.replace(tzinfo=None) - timedelta(days=window_days)
    total_events, unique_journeys, counts = store.summarize(since)
    return ProductFunnelSummary(
        window_days=window_days,
        generated_at=generated_at,
        total_events=total_events,
        unique_journeys=unique_journeys,
        stages=[
            ProductFunnelStage(
                event_name=event_name,
                event_count=counts.get(event_name, (0, 0))[0],
                unique_journeys=counts.get(event_name, (0, 0))[1],
            )
            for event_name in PRODUCT_EVENT_ORDER
        ],
    )
