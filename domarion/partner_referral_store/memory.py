from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    PartnerReferral,
    PartnerReferralCreate,
    PartnerReferralStatus,
    PartnerReferralType,
    PartnerReferralUpdate,
)


class InMemoryPartnerReferralStore:
    def __init__(self) -> None:
        self._referrals: dict[str, PartnerReferral] = {}

    def create_referral(self, owner_id: str, payload: PartnerReferralCreate) -> PartnerReferral:
        now = datetime.now(UTC)
        referral = PartnerReferral(
            id=str(uuid4()),
            owner_id=owner_id,
            referral_type=payload.referral_type,
            status="new",
            source_context=payload.source_context,
            listing_id=payload.listing_id,
            report_id=payload.report_id,
            city=payload.city,
            district=payload.district,
            contact_name=payload.contact_name,
            contact_email=payload.contact_email,
            contact_phone=payload.contact_phone,
            message=payload.message,
            consent_to_contact=payload.consent_to_contact,
            metadata=payload.metadata,
            assigned_to=None,
            partner_name=None,
            notes=None,
            created_at=now,
            updated_at=now,
        )
        self._referrals[referral.id] = referral
        return referral

    def list_referrals(self, owner_id: str, limit: int = 50) -> list[PartnerReferral]:
        referrals = [item for item in self._referrals.values() if item.owner_id == owner_id]
        return self._sort(referrals)[:limit]

    def get_referral(self, owner_id: str, referral_id: str) -> PartnerReferral | None:
        referral = self._referrals.get(referral_id)
        if referral is None or referral.owner_id != owner_id:
            return None
        return referral

    def list_all(
        self,
        limit: int = 100,
        status: PartnerReferralStatus | None = None,
        referral_type: PartnerReferralType | None = None,
    ) -> list[PartnerReferral]:
        referrals = list(self._referrals.values())
        if status is not None:
            referrals = [item for item in referrals if item.status == status]
        if referral_type is not None:
            referrals = [item for item in referrals if item.referral_type == referral_type]
        return self._sort(referrals)[:limit]

    def update_referral(
        self,
        referral_id: str,
        payload: PartnerReferralUpdate,
    ) -> PartnerReferral | None:
        referral = self._referrals.get(referral_id)
        if referral is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(UTC)
        updated = referral.model_copy(update=update_data)
        self._referrals[referral_id] = updated
        return updated

    def clear(self) -> None:
        self._referrals.clear()

    @staticmethod
    def _sort(referrals: list[PartnerReferral]) -> list[PartnerReferral]:
        return sorted(referrals, key=lambda item: item.created_at, reverse=True)
