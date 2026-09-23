from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from domarion.db.models import (
    UserSubmittedDocumentCheck as UserSubmittedDocumentCheckModel,
)
from domarion.db.models import (
    UserSubmittedListingDraft as UserSubmittedListingDraftModel,
)
from domarion.schemas import (
    DocumentCheck,
    DocumentConflict,
    DocumentSignal,
    DocumentUnknown,
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
        self.session.query(UserSubmittedDocumentCheckModel).filter(
            UserSubmittedDocumentCheckModel.owner_id == owner_id,
            UserSubmittedDocumentCheckModel.draft_id == draft_id,
            UserSubmittedDocumentCheckModel.deleted.is_(False),
        ).update(
            {
                "deleted": True,
                "updated_at": datetime.utcnow(),
            },
            synchronize_session=False,
        )
        self.session.delete(row)
        self.session.commit()
        return True

    def save_document_check(self, owner_id: str, check: DocumentCheck) -> DocumentCheck:
        row = UserSubmittedDocumentCheckModel(
            id=check.id,
            owner_id=owner_id,
            draft_id=check.draft_id,
            document_type=check.document_type,
            upload_channel=check.upload_channel,
            status=check.status,
            filename=check.filename,
            content_type=check.content_type,
            file_size_bytes=check.file_size_bytes,
            source_hash=check.source_hash,
            signals_json=[item.model_dump(mode="json") for item in check.signals],
            unknowns_json=[item.model_dump(mode="json") for item in check.unknowns],
            conflicts_json=[item.model_dump(mode="json") for item in check.conflicts],
            confidence=check.confidence,
            retention_deadline=check.retention_deadline,
            raw_document_retained=check.raw_document_retained,
            disclaimer=check.disclaimer,
            deleted=False,
            created_at=check.created_at,
            updated_at=check.updated_at,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._row_to_document_check(row)

    def list_document_checks(self, owner_id: str, draft_id: str) -> list[DocumentCheck]:
        rows = self.session.scalars(
            select(UserSubmittedDocumentCheckModel)
            .where(
                UserSubmittedDocumentCheckModel.owner_id == owner_id,
                UserSubmittedDocumentCheckModel.draft_id == draft_id,
                UserSubmittedDocumentCheckModel.deleted.is_(False),
            )
            .order_by(UserSubmittedDocumentCheckModel.created_at.desc())
        ).all()
        return [self._row_to_document_check(row) for row in rows]

    def count_document_checks(self, owner_id: str, draft_id: str) -> int:
        return int(
            self.session.scalar(
                select(func.count())
                .select_from(UserSubmittedDocumentCheckModel)
                .where(
                    UserSubmittedDocumentCheckModel.owner_id == owner_id,
                    UserSubmittedDocumentCheckModel.draft_id == draft_id,
                    UserSubmittedDocumentCheckModel.deleted.is_(False),
                )
            )
            or 0
        )

    def delete_document_check(
        self,
        owner_id: str,
        draft_id: str,
        document_check_id: str,
    ) -> bool:
        row = self.session.get(UserSubmittedDocumentCheckModel, document_check_id)
        if (
            row is None
            or row.owner_id != owner_id
            or row.draft_id != draft_id
            or row.deleted
        ):
            return False
        row.deleted = True
        row.updated_at = datetime.utcnow()
        self.session.commit()
        return True

    def prune_expired(self) -> int:
        expired_draft_ids = list(
            self.session.scalars(
                select(UserSubmittedListingDraftModel.id).where(
                    UserSubmittedListingDraftModel.expires_at <= datetime.utcnow()
                )
            ).all()
        )
        if expired_draft_ids:
            self.session.query(UserSubmittedDocumentCheckModel).filter(
                UserSubmittedDocumentCheckModel.draft_id.in_(expired_draft_ids),
                UserSubmittedDocumentCheckModel.deleted.is_(False),
            ).update(
                {
                    "deleted": True,
                    "updated_at": datetime.utcnow(),
                },
                synchronize_session=False,
            )
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
            developer_id=row.developer_id,
            developer_name=row.developer_name,
            investment_name=row.investment_name,
            primary_market_project_id=row.primary_market_project_id,
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

    @staticmethod
    def _row_to_document_check(row: UserSubmittedDocumentCheckModel) -> DocumentCheck:
        return DocumentCheck(
            id=row.id,
            draft_id=row.draft_id,
            document_type=row.document_type,
            upload_channel=row.upload_channel,
            status=row.status,
            filename=row.filename,
            content_type=row.content_type,
            file_size_bytes=row.file_size_bytes,
            source_hash=row.source_hash,
            signals=[DocumentSignal.model_validate(item) for item in row.signals_json],
            unknowns=[DocumentUnknown.model_validate(item) for item in row.unknowns_json],
            conflicts=[DocumentConflict.model_validate(item) for item in row.conflicts_json],
            confidence=row.confidence,
            retention_deadline=row.retention_deadline,
            raw_document_retained=row.raw_document_retained,
            disclaimer=row.disclaimer,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
