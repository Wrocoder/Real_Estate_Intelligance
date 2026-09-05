from domarion.schemas import BuyerSourceEvidence

SOURCE_TYPE_LABELS = {
    "area_market_snapshot": "district market snapshot",
    "area_statistics": "district statistics",
    "derived_comparable_sample": "comparable sample",
    "derived_estimate": "derived estimate",
    "derived_model": "model estimate",
    "deterministic_fixture": "demo fixture",
    "listing_reference": "listing data",
    "listing_snapshot": "listing history",
    "market_snapshot": "market snapshot",
    "market_statistics": "market statistics",
    "news_source": "news source",
    "open_data_or_admin_verified": "public or verified data",
}

CALCULATION_TYPE_LABELS = {
    "observed": "observed fact",
    "calculated": "calculated from data",
    "model_estimate": "model estimate",
    "unknown": "method not specified",
}


def provenance_evidence_details(item: BuyerSourceEvidence) -> list[str]:
    details = [
        f"source type: {SOURCE_TYPE_LABELS.get(item.source_type, 'not specified')}",
    ]
    if item.updated_at is not None:
        details.append(f"updated: {item.updated_at.isoformat()}")
    if item.sample_size is not None:
        details.append(f"observations: {item.sample_size}")
    if item.geographic_scope:
        details.append(f"scope: {item.geographic_scope}")
    if item.time_range:
        details.append(f"time range: {item.time_range}")
    details.append(
        f"method: {CALCULATION_TYPE_LABELS.get(item.calculation_type, 'method not specified')}"
    )
    return details
