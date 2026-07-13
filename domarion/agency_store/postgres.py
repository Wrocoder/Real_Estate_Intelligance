from datetime import datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from domarion.db.models import Agency as AgencyModel
from domarion.db.models import AgencyMembership as AgencyMembershipModel
from domarion.schemas import (
    AgencyMemberCreate,
    AgencyMembership,
    AgencyMemberUpdate,
    AgencyWorkspace,
    AgencyWorkspaceCreate,
    AgencyWorkspaceSummary,
    AgencyWorkspaceUpdate,
    UserAccount,
)


class PostgresAgencyStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_agency(self, owner: UserAccount, payload: AgencyWorkspaceCreate) -> AgencyWorkspace:
        now = datetime.utcnow()
        agency = AgencyModel(
            id=str(uuid4()),
            name=payload.name,
            owner_id=owner.id,
            billing_email=payload.billing_email,
            website_url=payload.website_url,
            city=payload.city,
            created_at=now,
            updated_at=now,
        )
        membership = AgencyMembershipModel(
            id=str(uuid4()),
            agency_id=agency.id,
            user_id=owner.id,
            email=owner.email,
            display_name=owner.display_name,
            role="owner",
            status="active",
            invited_by=owner.id,
            created_at=now,
            updated_at=now,
        )
        self.session.add(agency)
        self.session.add(membership)
        self.session.commit()
        self.session.refresh(agency)
        self.session.refresh(membership)
        return self._workspace_from_rows(agency, membership)

    def list_agencies(self, user_id: str, limit: int = 50) -> list[AgencyWorkspaceSummary]:
        rows = self.session.execute(
            select(AgencyModel, AgencyMembershipModel)
            .join(AgencyMembershipModel, AgencyMembershipModel.agency_id == AgencyModel.id)
            .where(
                AgencyMembershipModel.user_id == user_id,
                AgencyMembershipModel.status != "disabled",
            )
            .order_by(AgencyModel.created_at.desc())
            .limit(limit)
        ).all()
        return [self._summary_from_rows(agency, membership) for agency, membership in rows]

    def get_agency(self, user_id: str, agency_id: str) -> AgencyWorkspace | None:
        row = self.session.execute(
            select(AgencyModel, AgencyMembershipModel)
            .join(AgencyMembershipModel, AgencyMembershipModel.agency_id == AgencyModel.id)
            .where(
                AgencyModel.id == agency_id,
                AgencyMembershipModel.user_id == user_id,
                AgencyMembershipModel.status != "disabled",
            )
        ).first()
        if row is None:
            return None
        agency, membership = row
        return self._workspace_from_rows(agency, membership)

    def get_membership(self, agency_id: str, user_id: str) -> AgencyMembership | None:
        row = self.session.scalar(
            select(AgencyMembershipModel).where(
                AgencyMembershipModel.agency_id == agency_id,
                AgencyMembershipModel.user_id == user_id,
            )
        )
        if row is None:
            return None
        return self._membership_from_row(row)

    def update_agency(
        self,
        agency_id: str,
        payload: AgencyWorkspaceUpdate,
    ) -> AgencyWorkspace | None:
        agency = self.session.get(AgencyModel, agency_id)
        if agency is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(agency, key, value)
        agency.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(agency)
        return self.get_agency(agency.owner_id, agency.id)

    def add_member(
        self,
        agency_id: str,
        payload: AgencyMemberCreate,
        invited_by: str,
    ) -> AgencyMembership:
        existing = self.session.scalar(
            select(AgencyMembershipModel).where(
                AgencyMembershipModel.agency_id == agency_id,
                AgencyMembershipModel.user_id == payload.user_id,
            )
        )
        now = datetime.utcnow()
        if existing is not None:
            existing.email = payload.email
            existing.display_name = payload.display_name
            existing.role = payload.role
            existing.status = payload.status
            existing.invited_by = invited_by
            existing.updated_at = now
            self.session.commit()
            self.session.refresh(existing)
            return self._membership_from_row(existing)

        row = AgencyMembershipModel(
            id=str(uuid4()),
            agency_id=agency_id,
            user_id=payload.user_id,
            email=payload.email,
            display_name=payload.display_name,
            role=payload.role,
            status=payload.status,
            invited_by=invited_by,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._membership_from_row(row)

    def update_member(
        self,
        agency_id: str,
        membership_id: str,
        payload: AgencyMemberUpdate,
    ) -> AgencyMembership | None:
        row = self.session.get(AgencyMembershipModel, membership_id)
        if row is None or row.agency_id != agency_id:
            return None
        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return self._membership_from_row(row)
        for key, value in update_data.items():
            setattr(row, key, value)
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._membership_from_row(row)

    def remove_member(self, agency_id: str, membership_id: str) -> bool:
        row = self.session.get(AgencyMembershipModel, membership_id)
        if row is None or row.agency_id != agency_id:
            return False
        self.session.delete(row)
        self.session.commit()
        return True

    def count_active_owners(self, agency_id: str) -> int:
        return (
            self.session.scalar(
                select(func.count(AgencyMembershipModel.id)).where(
                    AgencyMembershipModel.agency_id == agency_id,
                    AgencyMembershipModel.role == "owner",
                    AgencyMembershipModel.status == "active",
                )
            )
            or 0
        )

    def _workspace_from_rows(
        self,
        agency: AgencyModel,
        membership: AgencyMembershipModel,
    ) -> AgencyWorkspace:
        return AgencyWorkspace(
            **self._agency_payload(agency),
            current_user_role=membership.role,
            current_user_status=membership.status,
            members_count=self._members_count(agency.id),
            members=self._members(agency.id),
        )

    def _summary_from_rows(
        self,
        agency: AgencyModel,
        membership: AgencyMembershipModel,
    ) -> AgencyWorkspaceSummary:
        return AgencyWorkspaceSummary(
            **self._agency_payload(agency),
            current_user_role=membership.role,
            current_user_status=membership.status,
            members_count=self._members_count(agency.id),
        )

    def _members(self, agency_id: str) -> list[AgencyMembership]:
        rows = self.session.scalars(
            select(AgencyMembershipModel)
            .where(AgencyMembershipModel.agency_id == agency_id)
            .order_by(
                AgencyMembershipModel.role.desc(),
                AgencyMembershipModel.created_at.asc(),
            )
        ).all()
        return [self._membership_from_row(row) for row in rows]

    def _members_count(self, agency_id: str) -> int:
        return (
            self.session.scalar(
                select(func.count(AgencyMembershipModel.id)).where(
                    AgencyMembershipModel.agency_id == agency_id,
                    AgencyMembershipModel.status != "disabled",
                )
            )
            or 0
        )

    @staticmethod
    def _agency_payload(row: AgencyModel) -> dict:
        return {
            "id": row.id,
            "name": row.name,
            "owner_id": row.owner_id,
            "billing_email": row.billing_email,
            "website_url": row.website_url,
            "city": row.city,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        }

    @staticmethod
    def _membership_from_row(row: AgencyMembershipModel) -> AgencyMembership:
        return AgencyMembership(
            id=row.id,
            agency_id=row.agency_id,
            user_id=row.user_id,
            email=row.email,
            display_name=row.display_name,
            role=row.role,
            status=row.status,
            invited_by=row.invited_by,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
