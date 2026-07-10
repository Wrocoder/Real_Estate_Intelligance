from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import DataQualityLog as DataQualityLogRow
from domarion.db.models import IngestionJob as IngestionJobRow
from domarion.db.models import ListingSource, RawListing
from domarion.ingestion.db_writer import ImportResult
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.schemas import (
    DataQualityLog,
    DataQualityLogCreate,
    DataQualitySeverity,
    IngestionJob,
    IngestionJobCreate,
    IngestionJobStatus,
    RawListingSummary,
)


class PostgresIngestionAdminStore(IngestionAdminStore):
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_job(self, payload: IngestionJobCreate) -> IngestionJob:
        now = datetime.utcnow()
        row = IngestionJobRow(
            id=str(uuid4()),
            source_name=payload.source_name,
            source_type=payload.source_type,
            status=payload.status,
            rows_seen=0,
            raw_created=0,
            raw_updated=0,
            properties_created=0,
            properties_updated=0,
            snapshots_created=0,
            snapshots_updated=0,
            errors_count=0,
            created_by=payload.created_by,
            notes=payload.notes,
            metadata_json=payload.metadata,
            started_at=now if payload.status == "running" else None,
            finished_at=now if payload.status in {"succeeded", "failed"} else None,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._job_to_schema(row)

    def mark_job_running(self, job_id: str) -> IngestionJob | None:
        row = self.session.get(IngestionJobRow, job_id)
        if row is None:
            return None
        now = datetime.utcnow()
        row.status = "running"
        row.started_at = now
        row.updated_at = now
        self.session.commit()
        self.session.refresh(row)
        return self._job_to_schema(row)

    def finish_job(
        self,
        job_id: str,
        result: ImportResult,
        status: IngestionJobStatus = "succeeded",
        errors_count: int = 0,
    ) -> IngestionJob | None:
        row = self.session.get(IngestionJobRow, job_id)
        if row is None:
            return None
        for key, value in result.as_dict().items():
            setattr(row, key, value)
        row.status = status
        row.errors_count = errors_count
        row.finished_at = datetime.utcnow()
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._job_to_schema(row)

    def list_jobs(self, limit: int = 50) -> list[IngestionJob]:
        rows = self.session.scalars(
            select(IngestionJobRow).order_by(IngestionJobRow.created_at.desc()).limit(limit)
        ).all()
        return [self._job_to_schema(row) for row in rows]

    def get_job(self, job_id: str) -> IngestionJob | None:
        row = self.session.get(IngestionJobRow, job_id)
        if row is None:
            return None
        return self._job_to_schema(row)

    def create_quality_log(self, payload: DataQualityLogCreate) -> DataQualityLog:
        row = DataQualityLogRow(
            id=str(uuid4()),
            job_id=payload.job_id,
            source_name=payload.source_name,
            source_listing_id=payload.source_listing_id,
            severity=payload.severity,
            code=payload.code,
            message=payload.message,
            payload=payload.payload,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._quality_log_to_schema(row)

    def list_quality_logs(
        self,
        job_id: str | None = None,
        severity: DataQualitySeverity | None = None,
        limit: int = 100,
    ) -> list[DataQualityLog]:
        statement = select(DataQualityLogRow)
        if job_id:
            statement = statement.where(DataQualityLogRow.job_id == job_id)
        if severity:
            statement = statement.where(DataQualityLogRow.severity == severity)
        rows = self.session.scalars(
            statement.order_by(DataQualityLogRow.created_at.desc()).limit(limit)
        ).all()
        return [self._quality_log_to_schema(row) for row in rows]

    def list_raw_listings(
        self,
        source_name: str | None = None,
        limit: int = 100,
    ) -> list[RawListingSummary]:
        statement = select(RawListing, ListingSource).join(ListingSource)
        if source_name:
            statement = statement.where(ListingSource.name == source_name)
        rows = self.session.execute(
            statement.order_by(RawListing.fetched_at.desc()).limit(limit)
        ).all()
        return [self._raw_listing_to_schema(raw, source) for raw, source in rows]

    def get_raw_listing(self, raw_listing_id: str) -> RawListingSummary | None:
        if not raw_listing_id.isdigit():
            return None
        statement = (
            select(RawListing, ListingSource)
            .join(ListingSource)
            .where(RawListing.id == int(raw_listing_id))
        )
        row = self.session.execute(statement).first()
        if row is None:
            return None
        raw, source = row
        return self._raw_listing_to_schema(raw, source)

    @staticmethod
    def _job_to_schema(row: IngestionJobRow) -> IngestionJob:
        return IngestionJob(
            id=row.id,
            source_name=row.source_name,
            source_type=row.source_type,
            status=row.status,
            rows_seen=row.rows_seen,
            raw_created=row.raw_created,
            raw_updated=row.raw_updated,
            properties_created=row.properties_created,
            properties_updated=row.properties_updated,
            snapshots_created=row.snapshots_created,
            snapshots_updated=row.snapshots_updated,
            errors_count=row.errors_count,
            created_by=row.created_by,
            notes=row.notes,
            metadata=row.metadata_json,
            started_at=row.started_at,
            finished_at=row.finished_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _quality_log_to_schema(row: DataQualityLogRow) -> DataQualityLog:
        return DataQualityLog(
            id=row.id,
            job_id=row.job_id,
            source_name=row.source_name,
            source_listing_id=row.source_listing_id,
            severity=row.severity,
            code=row.code,
            message=row.message,
            payload=row.payload,
            created_at=row.created_at,
        )

    @staticmethod
    def _raw_listing_to_schema(raw: RawListing, source: ListingSource) -> RawListingSummary:
        return RawListingSummary(
            id=raw.id,
            source_name=source.name,
            source_listing_id=raw.source_listing_id,
            source_url=raw.source_url,
            fetched_at=raw.fetched_at,
            payload_hash=raw.payload_hash,
            raw_payload=raw.raw_payload,
        )
