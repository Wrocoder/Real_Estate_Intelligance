from typing import Protocol

from domarion.schemas import (
    CrmClient,
    CrmClientCreate,
    CrmClientStatus,
    CrmClientUpdate,
    CrmNote,
    CrmNoteCreate,
    CrmNoteUpdate,
    CrmShortlist,
    CrmShortlistCreate,
    CrmShortlistUpdate,
)


class CrmStore(Protocol):
    def create_client(
        self,
        agency_id: str,
        owner_id: str,
        created_by: str,
        payload: CrmClientCreate,
    ) -> CrmClient:
        raise NotImplementedError

    def list_clients(
        self,
        agency_id: str,
        limit: int = 50,
        status: CrmClientStatus | None = None,
        query: str | None = None,
    ) -> list[CrmClient]:
        raise NotImplementedError

    def get_client(self, agency_id: str, client_id: str) -> CrmClient | None:
        raise NotImplementedError

    def update_client(
        self,
        agency_id: str,
        client_id: str,
        payload: CrmClientUpdate,
    ) -> CrmClient | None:
        raise NotImplementedError

    def create_note(
        self,
        agency_id: str,
        client_id: str,
        author_id: str,
        payload: CrmNoteCreate,
    ) -> CrmNote:
        raise NotImplementedError

    def list_notes(self, agency_id: str, client_id: str, limit: int = 100) -> list[CrmNote]:
        raise NotImplementedError

    def get_note(self, agency_id: str, client_id: str, note_id: str) -> CrmNote | None:
        raise NotImplementedError

    def update_note(
        self,
        agency_id: str,
        client_id: str,
        note_id: str,
        payload: CrmNoteUpdate,
    ) -> CrmNote | None:
        raise NotImplementedError

    def delete_note(self, agency_id: str, client_id: str, note_id: str) -> bool:
        raise NotImplementedError

    def create_shortlist(
        self,
        agency_id: str,
        client_id: str,
        owner_id: str,
        created_by: str,
        payload: CrmShortlistCreate,
    ) -> CrmShortlist:
        raise NotImplementedError

    def list_shortlists(
        self,
        agency_id: str,
        client_id: str,
        limit: int = 50,
    ) -> list[CrmShortlist]:
        raise NotImplementedError

    def get_shortlist(
        self,
        agency_id: str,
        client_id: str,
        shortlist_id: str,
    ) -> CrmShortlist | None:
        raise NotImplementedError

    def get_shortlist_by_share_token(self, share_token: str) -> CrmShortlist | None:
        raise NotImplementedError

    def update_shortlist(
        self,
        agency_id: str,
        client_id: str,
        shortlist_id: str,
        payload: CrmShortlistUpdate,
    ) -> CrmShortlist | None:
        raise NotImplementedError

    def delete_shortlist(self, agency_id: str, client_id: str, shortlist_id: str) -> bool:
        raise NotImplementedError
