from typing import Protocol

from domarion.schemas import (
    UserSubmittedListingAnalysis,
    UserSubmittedListingDraft,
    UserSubmittedListingRequest,
)


class UserSubmittedListingStore(Protocol):
    def save_draft(
        self,
        owner_id: str,
        payload: UserSubmittedListingRequest,
        analysis: UserSubmittedListingAnalysis,
    ) -> UserSubmittedListingDraft:
        raise NotImplementedError

    def list_drafts(
        self,
        owner_id: str,
        include_expired: bool = False,
        limit: int = 50,
    ) -> list[UserSubmittedListingDraft]:
        raise NotImplementedError

    def list_admin_drafts(
        self,
        include_expired: bool = False,
        limit: int = 100,
    ) -> list[UserSubmittedListingDraft]:
        raise NotImplementedError

    def get_draft(self, owner_id: str, draft_id: str) -> UserSubmittedListingDraft | None:
        raise NotImplementedError

    def delete_draft(self, owner_id: str, draft_id: str) -> bool:
        raise NotImplementedError

    def prune_expired(self) -> int:
        raise NotImplementedError
