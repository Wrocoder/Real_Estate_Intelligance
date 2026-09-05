from math import isfinite
from typing import Protocol

from domarion.schemas import (
    BuyerVerdictStatus,
    GeneratedReport,
    GeneratedReportCreate,
    GeneratedReportDecisionSummary,
    GeneratedReportListItem,
    PurchaseIntent,
)

BUYER_VERDICT_STATUSES: frozenset[BuyerVerdictStatus] = frozenset(
    {"buy", "negotiate", "avoid", "verify_first"}
)
PURCHASE_INTENTS: frozenset[PurchaseIntent] = frozenset(
    {"self", "family", "rental", "investment", "unsure"}
)


def report_decision_summary_from_metadata(
    metadata: dict,
) -> GeneratedReportDecisionSummary | None:
    """Expose only the non-sensitive decision snapshot stored with a report."""
    status = metadata.get("buyer_verdict_status")
    status = status if status in BUYER_VERDICT_STATUSES else None
    selected_intent = metadata.get("buyer_selected_intent")
    selected_intent = selected_intent if selected_intent in PURCHASE_INTENTS else None
    values = {
        "status": status,
        "score": _metadata_number(metadata.get("buyer_verdict_score"), minimum=0, maximum=10),
        "headline": _metadata_text(metadata.get("buyer_verdict_headline")),
        "summary": _metadata_text(metadata.get("buyer_verdict_summary")),
        "seller_price_pln": _metadata_int(metadata.get("buyer_seller_price_pln"), minimum=0),
        "fair_price_low_pln": _metadata_int(metadata.get("buyer_fair_price_low_pln"), minimum=0),
        "fair_price_mid_pln": _metadata_int(metadata.get("buyer_fair_price_mid_pln"), minimum=0),
        "fair_price_high_pln": _metadata_int(metadata.get("buyer_fair_price_high_pln"), minimum=0),
        "price_delta_to_fair_mid_pct": _metadata_number(
            metadata.get("buyer_price_delta_to_fair_mid_pct")
        ),
        "confidence_score": _metadata_int(
            metadata.get("fair_price_confidence_score"), minimum=0, maximum=100
        ),
        "recommended_offer_pln": _metadata_int(metadata.get("recommended_offer_pln"), minimum=0),
        "max_reasonable_offer_pln": _metadata_int(
            metadata.get("max_reasonable_offer_pln"), minimum=0
        ),
        "total_move_in_cost_pln": _metadata_int(
            metadata.get("total_move_in_cost_pln"), minimum=0
        ),
        "selected_intent": selected_intent,
        "selected_intent_score": _metadata_int(
            metadata.get("buyer_selected_intent_score"), minimum=0, maximum=100
        ),
    }
    if not any(value is not None for value in values.values()):
        return None
    return GeneratedReportDecisionSummary.model_validate(values)


def _metadata_text(value: object) -> str | None:
    return value if isinstance(value, str) else None


def _metadata_number(
    value: object,
    *,
    minimum: int | float | None = None,
    maximum: int | float | None = None,
) -> int | float | None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not isfinite(value):
        return None
    if minimum is not None and value < minimum:
        return None
    if maximum is not None and value > maximum:
        return None
    return value


def _metadata_int(
    value: object,
    *,
    minimum: int | float | None = None,
    maximum: int | float | None = None,
) -> int | None:
    numeric = _metadata_number(value, minimum=minimum, maximum=maximum)
    if isinstance(numeric, int):
        return numeric
    if isinstance(numeric, float) and numeric.is_integer():
        return int(numeric)
    return None


class ReportStore(Protocol):
    def save_report(self, payload: GeneratedReportCreate) -> GeneratedReport:
        raise NotImplementedError

    def list_reports(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReportListItem]:
        raise NotImplementedError

    def list_reports_with_metadata(
        self,
        limit: int = 50,
        owner_id: str | None = None,
    ) -> list[GeneratedReport]:
        raise NotImplementedError

    def get_report(
        self,
        report_id: str,
        owner_id: str | None = None,
    ) -> GeneratedReport | None:
        raise NotImplementedError
