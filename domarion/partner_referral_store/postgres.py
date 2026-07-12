from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import PartnerReferralLead as PartnerReferralLeadModel
from domarion.schemas import (
    PartnerReferral,
    PartnerReferralCreate,
    PartnerReferralStatus,
    PartnerReferralType,
    PartnerReferralUpdate,
)


class PostgresPartnerReferralStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_referral(self, owner_id: str, payload: PartnerReferralCreate) -> PartnerReferral:
        now = datetime.utcnow()
        row = PartnerReferralLeadModel(
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
            metadata_json=payload.metadata,
            assigned_to=None,
            partner_name=None,
            notes=None,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._referral_from_row(row)

    def list_referrals(self, owner_id: str, limit: int = 50) -> list[PartnerReferral]:
        rows = self.session.scalars(
            select(PartnerReferralLeadModel)
            .where(PartnerReferralLeadModel.owner_id == owner_id)
            .order_by(PartnerReferralLeadModel.created_at.desc())
            .limit(limit)
        ).all()
        return [self._referral_from_row(row) for row in rows]

    def get_referral(self, owner_id: str, referral_id: str) -> PartnerReferral | None:
        row = self.session.get(PartnerReferralLeadModel, referral_id)
        if row is None or row.owner_id != owner_id:
            return None
        return self._referral_from_row(row)

    def list_all(
        self,
        limit: int = 100,
        status: PartnerReferralStatus | None = None,
        referral_type: PartnerReferralType | None = None,
    ) -> list[PartnerReferral]:
        statement = select(PartnerReferralLeadModel)
        if status is not None:
            statement = statement.where(PartnerReferralLeadModel.status == status)
        if referral_type is not None:
            statement = statement.where(PartnerReferralLeadModel.referral_type == referral_type)

        rows = self.session.scalars(
            statement.order_by(PartnerReferralLeadModel.created_at.desc()).limit(limit)
        ).all()
        return [self._referral_from_row(row) for row in rows]

    def update_referral(
        self,
        referral_id: str,
        payload: PartnerReferralUpdate,
    ) -> PartnerReferral | None:
        row = self.session.get(PartnerReferralLeadModel, referral_id)
        if row is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if "status" in update_data:
            row.status = update_data["status"]
        if "assigned_to" in update_data:
            row.assigned_to = update_data["assigned_to"]
        if "partner_name" in update_data:
            row.partner_name = update_data["partner_name"]
        if "notes" in update_data:
            row.notes = update_data["notes"]
        if "metadata" in update_data and update_data["metadata"] is not None:
            row.metadata_json = update_data["metadata"]
        row.updated_at = datetime.utcnow()

        self.session.commit()
        self.session.refresh(row)
        return self._referral_from_row(row)

    @staticmethod
    def _referral_from_row(row: PartnerReferralLeadModel) -> PartnerReferral:
        return PartnerReferral(
            id=row.id,
            owner_id=row.owner_id,
            referral_type=row.referral_type,
            status=row.status,
            source_context=row.source_context,
            listing_id=row.listing_id,
            report_id=row.report_id,
            city=row.city,
            district=row.district,
            contact_name=row.contact_name,
            contact_email=row.contact_email,
            contact_phone=row.contact_phone,
            message=row.message,
            consent_to_contact=row.consent_to_contact,
            metadata=row.metadata_json,
            assigned_to=row.assigned_to,
            partner_name=row.partner_name,
            notes=row.notes,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
