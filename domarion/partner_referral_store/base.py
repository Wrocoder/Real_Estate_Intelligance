from typing import Protocol

from domarion.schemas import (
    PartnerReferral,
    PartnerReferralCreate,
    PartnerReferralStatus,
    PartnerReferralType,
    PartnerReferralUpdate,
)


class PartnerReferralStore(Protocol):
    def create_referral(self, owner_id: str, payload: PartnerReferralCreate) -> PartnerReferral:
        raise NotImplementedError

    def list_referrals(self, owner_id: str, limit: int = 50) -> list[PartnerReferral]:
        raise NotImplementedError

    def get_referral(self, owner_id: str, referral_id: str) -> PartnerReferral | None:
        raise NotImplementedError

    def list_all(
        self,
        limit: int = 100,
        status: PartnerReferralStatus | None = None,
        referral_type: PartnerReferralType | None = None,
    ) -> list[PartnerReferral]:
        raise NotImplementedError

    def update_referral(
        self,
        referral_id: str,
        payload: PartnerReferralUpdate,
    ) -> PartnerReferral | None:
        raise NotImplementedError
