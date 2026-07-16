from datetime import UTC, datetime, timedelta
from uuid import uuid4

from domarion.schemas import (
    UserSubmittedListingAnalysis,
    UserSubmittedListingDraft,
    UserSubmittedListingRequest,
)


class InMemoryUserSubmittedListingStore:
    def __init__(self) -> None:
        self._items: dict[str, UserSubmittedListingDraft] = {}

    def save_draft(
        self,
        owner_id: str,
        payload: UserSubmittedListingRequest,
        analysis: UserSubmittedListingAnalysis,
    ) -> UserSubmittedListingDraft:
        now = datetime.now(UTC)
        listing = analysis.analysis.listing
        draft = UserSubmittedListingDraft(
            id=str(uuid4()),
            owner_id=owner_id,
            listing_id=listing.id,
            source_url_private=analysis.source_url_private,
            source_domain=analysis.source_domain,
            address=listing.address,
            city=listing.city,
            district=listing.district,
            market_type=listing.market_type,
            developer_id=listing.developer_id,
            developer_name=listing.developer_name,
            investment_name=listing.investment_name,
            primary_market_project_id=listing.primary_market_project_id,
            price=listing.price,
            area_m2=listing.area_m2,
            rooms=listing.rooms,
            data_quality_score=listing.data_quality_score,
            confidence_score=analysis.confidence_score,
            request_payload=payload.model_dump(mode="json"),
            analysis_payload=analysis.model_dump(mode="json"),
            expires_at=now + timedelta(days=payload.retention_days),
            created_at=now,
            updated_at=now,
        )
        self._items[draft.id] = draft
        return draft

    def list_drafts(
        self,
        owner_id: str,
        include_expired: bool = False,
        limit: int = 50,
    ) -> list[UserSubmittedListingDraft]:
        drafts = [item for item in self._items.values() if item.owner_id == owner_id]
        return self._filter_sort_limit(drafts, include_expired=include_expired, limit=limit)

    def list_admin_drafts(
        self,
        include_expired: bool = False,
        limit: int = 100,
    ) -> list[UserSubmittedListingDraft]:
        return self._filter_sort_limit(
            list(self._items.values()),
            include_expired=include_expired,
            limit=limit,
        )

    def get_draft(self, owner_id: str, draft_id: str) -> UserSubmittedListingDraft | None:
        draft = self._items.get(draft_id)
        if draft is None or draft.owner_id != owner_id or _is_expired(draft):
            return None
        return draft

    def delete_draft(self, owner_id: str, draft_id: str) -> bool:
        draft = self._items.get(draft_id)
        if draft is None or draft.owner_id != owner_id:
            return False
        del self._items[draft_id]
        return True

    def prune_expired(self) -> int:
        expired_ids = [draft_id for draft_id, draft in self._items.items() if _is_expired(draft)]
        for draft_id in expired_ids:
            del self._items[draft_id]
        return len(expired_ids)

    def clear(self) -> None:
        self._items.clear()

    @staticmethod
    def _filter_sort_limit(
        drafts: list[UserSubmittedListingDraft],
        include_expired: bool,
        limit: int,
    ) -> list[UserSubmittedListingDraft]:
        filtered = (
            drafts
            if include_expired
            else [draft for draft in drafts if not _is_expired(draft)]
        )
        return sorted(filtered, key=lambda item: item.created_at, reverse=True)[:limit]


def _is_expired(draft: UserSubmittedListingDraft) -> bool:
    return draft.expires_at <= datetime.now(UTC)
