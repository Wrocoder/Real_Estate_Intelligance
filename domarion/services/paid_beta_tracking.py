from pydantic import ValidationError

from domarion.schemas import (
    PaidBetaTracking,
    PaidBetaTrackingRow,
    PaidBetaTrackingUpdate,
    PartnerReferral,
)

BETA_REFERRAL_TYPES = {"buyer_beta", "realtor_beta"}
TRACKING_METADATA_KEY = "paid_beta_tracking"


def is_paid_beta_referral(referral: PartnerReferral) -> bool:
    return referral.referral_type in BETA_REFERRAL_TYPES


def build_paid_beta_tracking_row(referral: PartnerReferral) -> PaidBetaTrackingRow:
    return PaidBetaTrackingRow(
        referral_id=referral.id,
        referral_type=referral.referral_type,
        status=referral.status,
        contact_name=referral.contact_name,
        contact_email=referral.contact_email,
        contact_phone=referral.contact_phone,
        city=referral.city,
        district=referral.district,
        listing_id=referral.listing_id,
        report_id=referral.report_id,
        created_at=referral.created_at,
        updated_at=referral.updated_at,
        tracking=build_paid_beta_tracking(referral),
    )


def build_paid_beta_tracking(referral: PartnerReferral) -> PaidBetaTracking:
    metadata = referral.metadata or {}
    raw_tracking = metadata.get(TRACKING_METADATA_KEY)
    seed = dict(raw_tracking) if isinstance(raw_tracking, dict) else {}

    seed.setdefault(
        "lead_source",
        _string_or_none(metadata.get("lead_source"))
        or _string_or_none(metadata.get("entry_point"))
        or referral.source_context,
    )
    seed.setdefault(
        "segment",
        _string_or_none(metadata.get("beta_segment")) or referral.referral_type,
    )
    seed.setdefault(
        "report_type",
        "realtor_bundle" if referral.referral_type == "realtor_beta" else "buyer_check",
    )
    if "payment_status" not in seed:
        price_paid = _int_or_zero(metadata.get("price_paid_pln"))
        seed["payment_status"] = "paid" if price_paid > 0 else "unpaid"
    for key in (
        "price_paid_pln",
        "decision_impact",
        "decision_impact_note",
        "objections",
        "missing_trust_data",
        "refund_risk",
        "next_follow_up_date",
        "expert_review_interest",
        "manual_qa_status",
        "manual_qa_notes",
    ):
        if key not in seed and key in metadata:
            seed[key] = metadata[key]

    try:
        return PaidBetaTracking(**seed)
    except ValidationError:
        return PaidBetaTracking(
            lead_source=referral.source_context,
            segment=referral.referral_type,
            report_type=(
                "realtor_bundle" if referral.referral_type == "realtor_beta" else "buyer_check"
            ),
        )


def merge_paid_beta_tracking_metadata(
    referral: PartnerReferral,
    payload: PaidBetaTrackingUpdate,
) -> dict:
    current = build_paid_beta_tracking(referral)
    update_data = payload.model_dump(exclude_unset=True)
    tracking = PaidBetaTracking(**{**current.model_dump(), **update_data})
    metadata = dict(referral.metadata or {})
    metadata[TRACKING_METADATA_KEY] = tracking.model_dump(mode="json")
    return metadata


def _string_or_none(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None


def _int_or_zero(value: object) -> int:
    if isinstance(value, bool):
        return 0
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            return 0
    return 0
