from datetime import UTC, datetime
from uuid import uuid4

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


class InMemoryAgencyStore:
    def __init__(self) -> None:
        self._agencies: dict[str, dict] = {}
        self._memberships: dict[str, AgencyMembership] = {}

    def create_agency(self, owner: UserAccount, payload: AgencyWorkspaceCreate) -> AgencyWorkspace:
        now = _now()
        agency = {
            "id": str(uuid4()),
            "name": payload.name,
            "owner_id": owner.id,
            "billing_email": payload.billing_email,
            "website_url": payload.website_url,
            "city": payload.city,
            "created_at": now,
            "updated_at": now,
        }
        self._agencies[agency["id"]] = agency
        membership = AgencyMembership(
            id=str(uuid4()),
            agency_id=agency["id"],
            user_id=owner.id,
            email=owner.email,
            display_name=owner.display_name,
            role="owner",
            status="active",
            invited_by=owner.id,
            created_at=now,
            updated_at=now,
        )
        self._memberships[membership.id] = membership
        return self._workspace_for_user(owner.id, agency["id"])  # type: ignore[return-value]

    def list_agencies(self, user_id: str, limit: int = 50) -> list[AgencyWorkspaceSummary]:
        memberships = [
            membership
            for membership in self._memberships.values()
            if membership.user_id == user_id and membership.status != "disabled"
        ]
        agencies = [
            self._summary_for_membership(membership)
            for membership in memberships
            if membership.agency_id in self._agencies
        ]
        return sorted(agencies, key=lambda item: item.created_at, reverse=True)[:limit]

    def get_agency(self, user_id: str, agency_id: str) -> AgencyWorkspace | None:
        return self._workspace_for_user(user_id, agency_id)

    def get_membership(self, agency_id: str, user_id: str) -> AgencyMembership | None:
        for membership in self._memberships.values():
            if membership.agency_id == agency_id and membership.user_id == user_id:
                return membership
        return None

    def update_agency(
        self,
        agency_id: str,
        payload: AgencyWorkspaceUpdate,
    ) -> AgencyWorkspace | None:
        agency = self._agencies.get(agency_id)
        if agency is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        update_data["updated_at"] = _now()
        agency.update(update_data)
        return self._workspace_for_user(agency["owner_id"], agency_id)

    def add_member(
        self,
        agency_id: str,
        payload: AgencyMemberCreate,
        invited_by: str,
    ) -> AgencyMembership:
        existing = self.get_membership(agency_id, payload.user_id)
        now = _now()
        if existing is not None:
            updated = existing.model_copy(
                update={
                    "email": payload.email,
                    "display_name": payload.display_name,
                    "role": payload.role,
                    "status": payload.status,
                    "invited_by": invited_by,
                    "updated_at": now,
                }
            )
            self._memberships[updated.id] = updated
            return updated

        membership = AgencyMembership(
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
        self._memberships[membership.id] = membership
        return membership

    def update_member(
        self,
        agency_id: str,
        membership_id: str,
        payload: AgencyMemberUpdate,
    ) -> AgencyMembership | None:
        membership = self._memberships.get(membership_id)
        if membership is None or membership.agency_id != agency_id:
            return None
        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return membership
        update_data["updated_at"] = _now()
        updated = membership.model_copy(update=update_data)
        self._memberships[membership_id] = updated
        return updated

    def remove_member(self, agency_id: str, membership_id: str) -> bool:
        membership = self._memberships.get(membership_id)
        if membership is None or membership.agency_id != agency_id:
            return False
        del self._memberships[membership_id]
        return True

    def count_active_owners(self, agency_id: str) -> int:
        return sum(
            1
            for membership in self._memberships.values()
            if membership.agency_id == agency_id
            and membership.role == "owner"
            and membership.status == "active"
        )

    def clear(self) -> None:
        self._agencies.clear()
        self._memberships.clear()

    def _workspace_for_user(self, user_id: str, agency_id: str) -> AgencyWorkspace | None:
        agency = self._agencies.get(agency_id)
        membership = self.get_membership(agency_id, user_id)
        if agency is None or membership is None or membership.status == "disabled":
            return None
        return AgencyWorkspace(
            **agency,
            current_user_role=membership.role,
            current_user_status=membership.status,
            members_count=self._members_count(agency_id),
            members=self._agency_members(agency_id),
        )

    def _summary_for_membership(self, membership: AgencyMembership) -> AgencyWorkspaceSummary:
        agency = self._agencies[membership.agency_id]
        return AgencyWorkspaceSummary(
            **agency,
            current_user_role=membership.role,
            current_user_status=membership.status,
            members_count=self._members_count(membership.agency_id),
        )

    def _agency_members(self, agency_id: str) -> list[AgencyMembership]:
        members = [
            membership
            for membership in self._memberships.values()
            if membership.agency_id == agency_id
        ]
        return sorted(members, key=lambda item: (item.role != "owner", item.created_at))

    def _members_count(self, agency_id: str) -> int:
        return sum(
            1
            for membership in self._memberships.values()
            if membership.agency_id == agency_id and membership.status != "disabled"
        )


def _now() -> datetime:
    return datetime.now(UTC)
