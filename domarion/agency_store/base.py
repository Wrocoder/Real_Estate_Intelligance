from typing import Protocol

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


class AgencyStore(Protocol):
    def create_agency(self, owner: UserAccount, payload: AgencyWorkspaceCreate) -> AgencyWorkspace:
        raise NotImplementedError

    def list_agencies(self, user_id: str, limit: int = 50) -> list[AgencyWorkspaceSummary]:
        raise NotImplementedError

    def get_agency(self, user_id: str, agency_id: str) -> AgencyWorkspace | None:
        raise NotImplementedError

    def get_membership(self, agency_id: str, user_id: str) -> AgencyMembership | None:
        raise NotImplementedError

    def update_agency(
        self,
        agency_id: str,
        payload: AgencyWorkspaceUpdate,
    ) -> AgencyWorkspace | None:
        raise NotImplementedError

    def add_member(
        self,
        agency_id: str,
        payload: AgencyMemberCreate,
        invited_by: str,
    ) -> AgencyMembership:
        raise NotImplementedError

    def update_member(
        self,
        agency_id: str,
        membership_id: str,
        payload: AgencyMemberUpdate,
    ) -> AgencyMembership | None:
        raise NotImplementedError

    def remove_member(self, agency_id: str, membership_id: str) -> bool:
        raise NotImplementedError

    def count_active_owners(self, agency_id: str) -> int:
        raise NotImplementedError
