from datetime import UTC, datetime, timedelta
from uuid import uuid4

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


class InMemoryCrmStore:
    def __init__(self) -> None:
        self._clients: dict[str, CrmClient] = {}
        self._notes: dict[str, CrmNote] = {}
        self._shortlists: dict[str, CrmShortlist] = {}

    def create_client(
        self,
        agency_id: str,
        owner_id: str,
        created_by: str,
        payload: CrmClientCreate,
    ) -> CrmClient:
        now = _now()
        client = CrmClient(
            id=str(uuid4()),
            agency_id=agency_id,
            owner_id=owner_id,
            display_name=payload.display_name,
            email=payload.email,
            phone=payload.phone,
            city=payload.city,
            district=payload.district,
            budget_min=payload.budget_min,
            budget_max=payload.budget_max,
            preferred_rooms=payload.preferred_rooms,
            status=payload.status,
            tags=payload.tags,
            consent_to_contact=payload.consent_to_contact,
            profile_notes=payload.profile_notes,
            metadata=payload.metadata,
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )
        self._clients[client.id] = client
        return client

    def list_clients(
        self,
        agency_id: str,
        limit: int = 50,
        status: CrmClientStatus | None = None,
        query: str | None = None,
    ) -> list[CrmClient]:
        clients = [client for client in self._clients.values() if client.agency_id == agency_id]
        if status is not None:
            clients = [client for client in clients if client.status == status]
        if query:
            needle = query.strip().lower()
            clients = [client for client in clients if _client_matches_query(client, needle)]
        return sorted(clients, key=lambda item: item.updated_at, reverse=True)[:limit]

    def get_client(self, agency_id: str, client_id: str) -> CrmClient | None:
        client = self._clients.get(client_id)
        if client is None or client.agency_id != agency_id:
            return None
        return client

    def update_client(
        self,
        agency_id: str,
        client_id: str,
        payload: CrmClientUpdate,
    ) -> CrmClient | None:
        client = self.get_client(agency_id, client_id)
        if client is None:
            return None
        update_data = _client_update_data(payload)
        if not update_data:
            return client
        update_data["updated_at"] = _now()
        updated = client.model_copy(update=update_data)
        if (
            updated.budget_min is not None
            and updated.budget_max is not None
            and updated.budget_min > updated.budget_max
        ):
            return None
        self._clients[client_id] = updated
        return updated

    def create_note(
        self,
        agency_id: str,
        client_id: str,
        author_id: str,
        payload: CrmNoteCreate,
    ) -> CrmNote:
        now = _now()
        note = CrmNote(
            id=str(uuid4()),
            agency_id=agency_id,
            client_id=client_id,
            author_id=author_id,
            body=payload.body,
            visibility=payload.visibility,
            pinned=payload.pinned,
            metadata=payload.metadata,
            created_at=now,
            updated_at=now,
        )
        self._notes[note.id] = note
        return note

    def list_notes(self, agency_id: str, client_id: str, limit: int = 100) -> list[CrmNote]:
        notes = [
            note
            for note in self._notes.values()
            if note.agency_id == agency_id and note.client_id == client_id
        ]
        return sorted(notes, key=lambda item: (item.pinned, item.updated_at), reverse=True)[:limit]

    def get_note(self, agency_id: str, client_id: str, note_id: str) -> CrmNote | None:
        note = self._notes.get(note_id)
        if note is None or note.agency_id != agency_id or note.client_id != client_id:
            return None
        return note

    def update_note(
        self,
        agency_id: str,
        client_id: str,
        note_id: str,
        payload: CrmNoteUpdate,
    ) -> CrmNote | None:
        note = self.get_note(agency_id, client_id, note_id)
        if note is None:
            return None
        update_data = _note_update_data(payload)
        if not update_data:
            return note
        update_data["updated_at"] = _now()
        updated = note.model_copy(update=update_data)
        self._notes[note_id] = updated
        return updated

    def delete_note(self, agency_id: str, client_id: str, note_id: str) -> bool:
        note = self.get_note(agency_id, client_id, note_id)
        if note is None:
            return False
        del self._notes[note_id]
        return True

    def create_shortlist(
        self,
        agency_id: str,
        client_id: str,
        owner_id: str,
        created_by: str,
        payload: CrmShortlistCreate,
    ) -> CrmShortlist:
        now = _now()
        share_fields = _share_fields(
            enabled=payload.share_enabled,
            expires_in_days=payload.expires_in_days,
        )
        shortlist = CrmShortlist(
            id=str(uuid4()),
            agency_id=agency_id,
            client_id=client_id,
            owner_id=owner_id,
            title=payload.title,
            listing_ids=payload.listing_ids,
            report_ids=payload.report_ids,
            client_message=payload.client_message,
            status=(
                "shared"
                if payload.share_enabled and payload.status == "draft"
                else payload.status
            ),
            metadata=payload.metadata,
            created_by=created_by,
            created_at=now,
            updated_at=now,
            **share_fields,
        )
        self._shortlists[shortlist.id] = shortlist
        return shortlist

    def list_shortlists(
        self,
        agency_id: str,
        client_id: str,
        limit: int = 50,
    ) -> list[CrmShortlist]:
        shortlists = [
            shortlist
            for shortlist in self._shortlists.values()
            if shortlist.agency_id == agency_id and shortlist.client_id == client_id
        ]
        return sorted(shortlists, key=lambda item: item.updated_at, reverse=True)[:limit]

    def get_shortlist(
        self,
        agency_id: str,
        client_id: str,
        shortlist_id: str,
    ) -> CrmShortlist | None:
        shortlist = self._shortlists.get(shortlist_id)
        if (
            shortlist is None
            or shortlist.agency_id != agency_id
            or shortlist.client_id != client_id
        ):
            return None
        return shortlist

    def get_shortlist_by_share_token(self, share_token: str) -> CrmShortlist | None:
        for shortlist in self._shortlists.values():
            if shortlist.share_token == share_token:
                return shortlist
        return None

    def update_shortlist(
        self,
        agency_id: str,
        client_id: str,
        shortlist_id: str,
        payload: CrmShortlistUpdate,
    ) -> CrmShortlist | None:
        shortlist = self.get_shortlist(agency_id, client_id, shortlist_id)
        if shortlist is None:
            return None
        update_data = _shortlist_update_data(payload)
        if "share_enabled" in update_data:
            update_data.update(
                _share_fields(
                    enabled=bool(update_data["share_enabled"]),
                    expires_in_days=payload.expires_in_days,
                    current_token=shortlist.share_token,
                )
            )
            if (
                update_data["share_enabled"]
                and update_data.get("status", shortlist.status) == "draft"
            ):
                update_data["status"] = "shared"
        elif payload.expires_in_days is not None and shortlist.share_enabled:
            update_data["expires_at"] = _now() + timedelta(days=payload.expires_in_days)
        update_data.pop("expires_in_days", None)
        if not update_data:
            return shortlist
        update_data["updated_at"] = _now()
        updated = shortlist.model_copy(update=update_data)
        self._shortlists[shortlist_id] = updated
        return updated

    def delete_shortlist(self, agency_id: str, client_id: str, shortlist_id: str) -> bool:
        shortlist = self.get_shortlist(agency_id, client_id, shortlist_id)
        if shortlist is None:
            return False
        del self._shortlists[shortlist_id]
        return True

    def clear(self) -> None:
        self._clients.clear()
        self._notes.clear()
        self._shortlists.clear()


def _client_update_data(payload: CrmClientUpdate) -> dict[str, object]:
    data = payload.model_dump(exclude_unset=True)
    for key in ("display_name", "status", "preferred_rooms", "tags", "consent_to_contact"):
        if data.get(key) is None:
            data.pop(key, None)
    return data


def _note_update_data(payload: CrmNoteUpdate) -> dict[str, object]:
    data = payload.model_dump(exclude_unset=True)
    for key in ("body", "visibility", "pinned"):
        if data.get(key) is None:
            data.pop(key, None)
    return data


def _shortlist_update_data(payload: CrmShortlistUpdate) -> dict[str, object]:
    data = payload.model_dump(exclude_unset=True)
    for key in ("title", "listing_ids", "report_ids", "status", "share_enabled"):
        if data.get(key) is None:
            data.pop(key, None)
    return data


def _share_fields(
    *,
    enabled: bool,
    expires_in_days: int | None,
    current_token: str | None = None,
) -> dict[str, object]:
    if not enabled:
        return {
            "share_enabled": False,
            "share_token": None,
            "share_url": None,
            "expires_at": None,
        }
    token = current_token or uuid4().hex
    return {
        "share_enabled": True,
        "share_token": token,
        "share_url": f"/api/v1/crm/shared-shortlists/{token}",
        "expires_at": _now() + timedelta(days=expires_in_days or 14),
    }


def _client_matches_query(client: CrmClient, needle: str) -> bool:
    haystack = [
        client.display_name,
        client.email,
        client.phone,
        client.city,
        client.district,
        *(client.tags or []),
    ]
    return any(value is not None and needle in value.lower() for value in haystack)


def _now() -> datetime:
    return datetime.now(UTC)
