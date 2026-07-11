from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from domarion.db.models import UserSubmittedListingDraft as UserSubmittedListingDraftModel
from domarion.schemas import (
    UserSubmittedListingAnalysis,
    UserSubmittedListingDraft,
    UserSubmittedListingRequest,
)


class PostgresUserSubmittedListingStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save_draft(
        self,
        owner_id: str,
        payload: UserSubmittedListingRequest,
        analysis: UserSubmittedListingAnalysis,
    ) -> UserSubmittedListingDraft:
        now = datetime.utcnow()
        listing = analysis.analysis.listing
        row = UserSubmittedListingDraftModel(
            id=str(uuid4()),
            owner_id=owner_id,
            listing_id=listing.id,
            source_url_private=analysis.source_url_private,
            source_domain=analysis.source_domain,
            address=listing.address,
            city=listing.city,
            district=listing.district,
            market_type=listing.market_type,
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
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_draft(row)

    def list_drafts(
        self,
        owner_id: str,
        include_expired: bool = False,
        limit: int = 50,
    ) -> list[UserSubmittedListingDraft]:
        statement = select(UserSubmittedListingDraftModel).where(
            UserSubmittedListingDraftModel.owner_id == owner_id
        )
        statement = self._filter_expired(statement, include_expired=include_expired)
        rows = self.session.scalars(
            statement.order_by(UserSubmittedListingDraftModel.created_at.desc()).limit(limit)
        ).all()
        return [self._row_to_draft(row) for row in rows]

    def list_admin_drafts(
        self,
        include_expired: bool = False,
        limit: int = 100,
    ) -> list[UserSubmittedListingDraft]:
        statement = select(UserSubmittedListingDraftModel)
        statement = self._filter_expired(statement, include_expired=include_expired)
        rows = self.session.scalars(
            statement.order_by(UserSubmittedListingDraftModel.created_at.desc()).limit(limit)
        ).all()
        return [self._row_to_draft(row) for row in rows]

    def get_draft(self, owner_id: str, draft_id: str) -> UserSubmittedListingDraft | None:
        row = self.session.get(UserSubmittedListingDraftModel, draft_id)
        if row is None or row.owner_id != owner_id or row.expires_at <= datetime.utcnow():
            return None
        return self._row_to_draft(row)

    def delete_draft(self, owner_id: str, draft_id: str) -> bool:
        row = self.session.get(UserSubmittedListingDraftModel, draft_id)
        if row is None or row.owner_id != owner_id:
            return False
        self.session.delete(row)
        self.session.commit()
        return True

    def prune_expired(self) -> int:
        result = self.session.execute(
            delete(UserSubmittedListingDraftModel).where(
                UserSubmittedListingDraftModel.expires_at <= datetime.utcnow()
            )
        )
        self.session.commit()
        return int(result.rowcount or 0)

    @staticmethod
    def _filter_expired(statement, include_expired: bool):
        if include_expired:
            return statement
        return statement.where(UserSubmittedListingDraftModel.expires_at > datetime.utcnow())

    @staticmethod
    def _row_to_draft(row: UserSubmittedListingDraftModel) -> UserSubmittedListingDraft:
        return UserSubmittedListingDraft(
            id=row.id,
            owner_id=row.owner_id,
            listing_id=row.listing_id,
            source_url_private=row.source_url_private,
            source_domain=row.source_domain,
            address=row.address,
            city=row.city,
            district=row.district,
            market_type=row.market_type,
            price=row.price,
            area_m2=float(row.area_m2),
            rooms=row.rooms,
            data_quality_score=row.data_quality_score,
            confidence_score=row.confidence_score,
            request_payload=row.request_payload,
            analysis_payload=row.analysis_payload,
            expires_at=row.expires_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
