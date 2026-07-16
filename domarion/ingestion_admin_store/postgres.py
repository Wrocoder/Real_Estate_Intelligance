from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import AdminAuditLog as AdminAuditLogRow
from domarion.db.models import DataDeletionRequest as DataDeletionRequestRow
from domarion.db.models import DataQualityLog as DataQualityLogRow
from domarion.db.models import IngestionJob as IngestionJobRow
from domarion.db.models import ListingSource, RawListing
from domarion.db.models import SourceCheckJob as SourceCheckJobRow
from domarion.db.models import SourceError as SourceErrorRow
from domarion.ingestion.db_writer import ImportResult
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.ingestion_admin_store.system_sources import system_source_payloads
from domarion.schemas import (
    AdminAuditLog,
    AdminAuditLogCreate,
    AdminAuditLogStatus,
    DataDeletionRequest,
    DataDeletionRequestCreate,
    DataDeletionRequestProcess,
    DataDeletionRequestStatus,
    DataDeletionTargetType,
    DataQualityLog,
    DataQualityLogCreate,
    DataQualitySeverity,
    IngestionJob,
    IngestionJobCreate,
    IngestionJobStatus,
    RawListingSummary,
    SourceCheckJob,
    SourceCheckJobCreate,
    SourceCheckJobStatus,
    SourceError,
    SourceErrorCreate,
    SourceErrorRetryResult,
    SourceErrorStatus,
    SourceErrorUpdate,
    SourceRegistryEntry,
    SourceRegistryEntryCreate,
    SourceRegistryEntryUpdate,
    SourceRetentionPruneResult,
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

    def create_source_check_job(self, payload: SourceCheckJobCreate) -> SourceCheckJob:
        now = datetime.utcnow()
        row = SourceCheckJobRow(
            id=str(uuid4()),
            source_id=_source_id_to_int(payload.source_id),
            source_name=payload.source_name,
            source_type=payload.source_type,
            check_type=payload.check_type,
            status=payload.status,
            target_domain=payload.target_domain,
            target_url_hash=payload.target_url_hash,
            created_by=payload.created_by,
            scheduled_for=payload.scheduled_for,
            started_at=now if payload.status == "running" else None,
            finished_at=now if payload.status in {"succeeded", "failed", "blocked"} else None,
            notes=payload.notes,
            metadata_json=payload.metadata,
            result_json={},
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._source_check_job_to_schema(row)

    def list_source_check_jobs(
        self,
        source_name: str | None = None,
        status: SourceCheckJobStatus | None = None,
        limit: int = 100,
    ) -> list[SourceCheckJob]:
        statement = select(SourceCheckJobRow)
        if source_name:
            statement = statement.where(SourceCheckJobRow.source_name == source_name)
        if status:
            statement = statement.where(SourceCheckJobRow.status == status)
        rows = self.session.scalars(
            statement.order_by(SourceCheckJobRow.created_at.desc()).limit(limit)
        ).all()
        return [self._source_check_job_to_schema(row) for row in rows]

    def create_source_error(self, payload: SourceErrorCreate) -> SourceError:
        now = datetime.utcnow()
        row = SourceErrorRow(
            id=str(uuid4()),
            source_id=_source_id_to_int(payload.source_id),
            source_name=payload.source_name,
            source_type=payload.source_type,
            source_check_job_id=payload.source_check_job_id,
            ingestion_job_id=payload.ingestion_job_id,
            severity=payload.severity,
            status=payload.status,
            error_code=payload.error_code,
            message=payload.message,
            retryable=payload.retryable,
            retry_count=0,
            next_retry_at=payload.next_retry_at,
            last_retry_job_id=None,
            resolved_at=now if payload.status in {"resolved", "ignored"} else None,
            resolved_by=None,
            resolution_note=None,
            metadata_json=payload.metadata,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._source_error_to_schema(row)

    def list_source_errors(
        self,
        source_name: str | None = None,
        status: SourceErrorStatus | None = None,
        severity: DataQualitySeverity | None = None,
        limit: int = 100,
    ) -> list[SourceError]:
        statement = select(SourceErrorRow)
        if source_name:
            statement = statement.where(SourceErrorRow.source_name == source_name)
        if status:
            statement = statement.where(SourceErrorRow.status == status)
        if severity:
            statement = statement.where(SourceErrorRow.severity == severity)
        rows = self.session.scalars(
            statement.order_by(SourceErrorRow.created_at.desc()).limit(limit)
        ).all()
        return [self._source_error_to_schema(row) for row in rows]

    def update_source_error(
        self,
        error_id: str,
        payload: SourceErrorUpdate,
    ) -> SourceError | None:
        row = self.session.get(SourceErrorRow, error_id)
        if row is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        if "metadata" in update_data:
            row.metadata_json = update_data.pop("metadata") or {}
        for key, value in update_data.items():
            setattr(row, key, value)
        if payload.status in {"resolved", "ignored"}:
            row.resolved_at = datetime.utcnow()
        elif payload.status in {"open", "retry_scheduled"}:
            row.resolved_at = None
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._source_error_to_schema(row)

    def retry_source_error(
        self,
        error_id: str,
        created_by: str = "system",
    ) -> SourceErrorRetryResult | None:
        row = self.session.get(SourceErrorRow, error_id)
        if row is None or not row.retryable:
            return None
        retry_job = self.create_source_check_job(
            SourceCheckJobCreate(
                source_id=str(row.source_id) if row.source_id is not None else None,
                source_name=row.source_name,
                source_type=row.source_type,
                check_type="manual_review",
                status="queued",
                target_domain=_metadata_str(row.metadata_json, "source_domain"),
                target_url_hash=_metadata_str(row.metadata_json, "source_url_hash"),
                created_by=created_by,
                notes=f"Retry for source error {row.id}: {row.error_code}",
                metadata={
                    "retry_for_source_error_id": row.id,
                    "previous_error_code": row.error_code,
                },
            )
        )
        row = self.session.get(SourceErrorRow, error_id)
        if row is None:
            return None
        row.status = "retry_scheduled"
        row.retry_count += 1
        row.last_retry_job_id = retry_job.id
        row.next_retry_at = retry_job.scheduled_for
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return SourceErrorRetryResult(
            error=self._source_error_to_schema(row),
            retry_job=retry_job,
        )

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

    def list_sources(self) -> list[SourceRegistryEntry]:
        self._ensure_system_sources()
        rows = self.session.scalars(
            select(ListingSource).order_by(ListingSource.created_at.desc(), ListingSource.name)
        ).all()
        return [self._source_to_schema(row) for row in rows]

    def create_source(self, payload: SourceRegistryEntryCreate) -> SourceRegistryEntry:
        now = datetime.utcnow()
        row = ListingSource(
            name=payload.name,
            source_type=payload.source_type,
            base_url=payload.base_url,
            legal_status=payload.legal_status,
            refresh_cadence=payload.refresh_cadence,
            owner=payload.owner,
            ingestion_method=payload.ingestion_method,
            allowed_use_json=payload.allowed_use,
            robots_txt_url=payload.robots_txt_url,
            terms_url=payload.terms_url,
            notes=payload.notes,
            raw_payload_retention_days=payload.raw_payload_retention_days,
            private_url_retention_days=payload.private_url_retention_days,
            retention_notes=payload.retention_notes,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._source_to_schema(row)

    def update_source(
        self,
        source_id: str,
        payload: SourceRegistryEntryUpdate,
    ) -> SourceRegistryEntry | None:
        if not source_id.isdigit():
            return None
        row = self.session.get(ListingSource, int(source_id))
        if row is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        if "allowed_use" in update_data:
            row.allowed_use_json = update_data.pop("allowed_use") or []
        for key, value in update_data.items():
            setattr(row, key, value)
        row.updated_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(row)
        return self._source_to_schema(row)

    def create_admin_audit_log(self, payload: AdminAuditLogCreate) -> AdminAuditLog:
        row = AdminAuditLogRow(
            id=str(uuid4()),
            action_type=payload.action_type,
            actor_id=payload.actor_id,
            actor_role=str(payload.actor_role),
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            status=payload.status,
            message=payload.message,
            metadata_json=payload.metadata,
            created_at=datetime.utcnow(),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._admin_audit_log_to_schema(row)

    def list_admin_audit_logs(
        self,
        action_type: str | None = None,
        actor_id: str | None = None,
        resource_type: str | None = None,
        status: AdminAuditLogStatus | None = None,
        limit: int = 100,
    ) -> list[AdminAuditLog]:
        statement = select(AdminAuditLogRow)
        if action_type:
            statement = statement.where(AdminAuditLogRow.action_type == action_type)
        if actor_id:
            statement = statement.where(AdminAuditLogRow.actor_id == actor_id)
        if resource_type:
            statement = statement.where(AdminAuditLogRow.resource_type == resource_type)
        if status:
            statement = statement.where(AdminAuditLogRow.status == status)
        rows = self.session.scalars(
            statement.order_by(AdminAuditLogRow.created_at.desc()).limit(limit)
        ).all()
        return [self._admin_audit_log_to_schema(row) for row in rows]

    def prune_retained_raw_payloads(
        self,
        dry_run: bool = True,
        source_name: str | None = None,
        limit: int = 500,
    ) -> SourceRetentionPruneResult:
        now = datetime.utcnow()
        source_statement = select(ListingSource).where(
            ListingSource.raw_payload_retention_days.is_not(None)
        )
        if source_name:
            source_statement = source_statement.where(ListingSource.name == source_name)
        sources = self.session.scalars(source_statement).all()
        source_ids = [source.id for source in sources]
        cutoff_by_source = {
            source.name: now - timedelta(days=source.raw_payload_retention_days or 0)
            for source in sources
        }
        if not source_ids:
            return SourceRetentionPruneResult(
                dry_run=dry_run,
                source_name=source_name,
                sources_checked=0,
                raw_listings_seen=0,
                raw_payloads_pruned=0,
                item_ids=[],
                cutoff_by_source={},
            )

        statement = (
            select(RawListing, ListingSource)
            .join(ListingSource)
            .where(RawListing.source_id.in_(source_ids))
            .order_by(RawListing.fetched_at.asc())
            .limit(limit)
        )
        rows = self.session.execute(statement).all()
        raw_listings_seen = 0
        pruned_ids: list[str] = []
        for raw, source in rows:
            raw_listings_seen += 1
            cutoff = cutoff_by_source[source.name]
            if raw.fetched_at > cutoff or _raw_payload_pruned(raw.raw_payload):
                continue
            pruned_ids.append(str(raw.id))
            if dry_run:
                continue
            raw.raw_payload = _retention_pruned_payload(
                original_hash=raw.payload_hash,
                source_name=source.name,
                raw_payload_retention_days=source.raw_payload_retention_days,
                pruned_at=now,
            )
            raw.payload_hash = _retention_payload_hash(raw.payload_hash)
        if not dry_run:
            self.session.commit()

        return SourceRetentionPruneResult(
            dry_run=dry_run,
            source_name=source_name,
            sources_checked=len(sources),
            raw_listings_seen=raw_listings_seen,
            raw_payloads_pruned=len(pruned_ids),
            item_ids=pruned_ids,
            cutoff_by_source=cutoff_by_source,
        )

    def create_data_deletion_request(
        self,
        payload: DataDeletionRequestCreate,
        requested_by: str,
    ) -> DataDeletionRequest:
        now = datetime.utcnow()
        row = DataDeletionRequestRow(
            id=str(uuid4()),
            target_type=payload.target_type,
            target_id=payload.target_id,
            target_owner_id=payload.target_owner_id,
            source_name=payload.source_name,
            source_url_hash=payload.source_url_hash,
            status="open",
            requested_by=requested_by,
            processed_by=None,
            reason=payload.reason,
            request_payload=payload.request_payload,
            result_payload={},
            action_summary=None,
            created_at=now,
            updated_at=now,
            processed_at=None,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._data_deletion_request_to_schema(row)

    def list_data_deletion_requests(
        self,
        status: DataDeletionRequestStatus | None = None,
        target_type: DataDeletionTargetType | None = None,
        limit: int = 100,
    ) -> list[DataDeletionRequest]:
        statement = select(DataDeletionRequestRow)
        if status:
            statement = statement.where(DataDeletionRequestRow.status == status)
        if target_type:
            statement = statement.where(DataDeletionRequestRow.target_type == target_type)
        rows = self.session.scalars(
            statement.order_by(DataDeletionRequestRow.created_at.desc()).limit(limit)
        ).all()
        return [self._data_deletion_request_to_schema(row) for row in rows]

    def get_data_deletion_request(self, request_id: str) -> DataDeletionRequest | None:
        row = self.session.get(DataDeletionRequestRow, request_id)
        if row is None:
            return None
        return self._data_deletion_request_to_schema(row)

    def process_data_deletion_request(
        self,
        request_id: str,
        payload: DataDeletionRequestProcess,
        processed_by: str,
    ) -> DataDeletionRequest | None:
        row = self.session.get(DataDeletionRequestRow, request_id)
        if row is None:
            return None
        now = datetime.utcnow()
        row.status = payload.status
        row.processed_by = processed_by
        row.action_summary = payload.action_summary
        row.result_payload = payload.result_payload
        row.processed_at = now
        row.updated_at = now
        self.session.commit()
        self.session.refresh(row)
        return self._data_deletion_request_to_schema(row)

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
    def _source_check_job_to_schema(row: SourceCheckJobRow) -> SourceCheckJob:
        return SourceCheckJob(
            id=row.id,
            source_id=str(row.source_id) if row.source_id is not None else None,
            source_name=row.source_name,
            source_type=row.source_type,
            check_type=row.check_type,
            status=row.status,
            target_domain=row.target_domain,
            target_url_hash=row.target_url_hash,
            created_by=row.created_by,
            scheduled_for=row.scheduled_for,
            started_at=row.started_at,
            finished_at=row.finished_at,
            notes=row.notes,
            metadata=row.metadata_json,
            result=row.result_json,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _source_error_to_schema(row: SourceErrorRow) -> SourceError:
        return SourceError(
            id=row.id,
            source_id=str(row.source_id) if row.source_id is not None else None,
            source_name=row.source_name,
            source_type=row.source_type,
            source_check_job_id=row.source_check_job_id,
            ingestion_job_id=row.ingestion_job_id,
            severity=row.severity,
            status=row.status,
            error_code=row.error_code,
            message=row.message,
            retryable=row.retryable,
            retry_count=row.retry_count,
            next_retry_at=row.next_retry_at,
            last_retry_job_id=row.last_retry_job_id,
            resolved_at=row.resolved_at,
            resolved_by=row.resolved_by,
            resolution_note=row.resolution_note,
            metadata=row.metadata_json,
            created_at=row.created_at,
            updated_at=row.updated_at,
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

    @staticmethod
    def _source_to_schema(row: ListingSource) -> SourceRegistryEntry:
        return SourceRegistryEntry(
            id=str(row.id),
            name=row.name,
            source_type=row.source_type,
            base_url=row.base_url,
            legal_status=row.legal_status,
            refresh_cadence=row.refresh_cadence,
            owner=row.owner,
            ingestion_method=row.ingestion_method,
            allowed_use=row.allowed_use_json or [],
            robots_txt_url=row.robots_txt_url,
            terms_url=row.terms_url,
            notes=row.notes,
            raw_payload_retention_days=row.raw_payload_retention_days,
            private_url_retention_days=row.private_url_retention_days,
            retention_notes=row.retention_notes,
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _admin_audit_log_to_schema(row: AdminAuditLogRow) -> AdminAuditLog:
        return AdminAuditLog(
            id=row.id,
            action_type=row.action_type,
            actor_id=row.actor_id,
            actor_role=row.actor_role,
            resource_type=row.resource_type,
            resource_id=row.resource_id,
            status=row.status,
            message=row.message,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )

    @staticmethod
    def _data_deletion_request_to_schema(row: DataDeletionRequestRow) -> DataDeletionRequest:
        return DataDeletionRequest(
            id=row.id,
            target_type=row.target_type,
            target_id=row.target_id,
            target_owner_id=row.target_owner_id,
            source_name=row.source_name,
            source_url_hash=row.source_url_hash,
            status=row.status,
            requested_by=row.requested_by,
            processed_by=row.processed_by,
            reason=row.reason,
            request_payload=row.request_payload,
            result_payload=row.result_payload,
            action_summary=row.action_summary,
            created_at=row.created_at,
            updated_at=row.updated_at,
            processed_at=row.processed_at,
        )

    def _ensure_system_sources(self) -> None:
        created = False
        for payload in system_source_payloads():
            existing = self.session.scalar(
                select(ListingSource).where(ListingSource.name == payload.name)
            )
            if existing is not None:
                continue
            now = datetime.utcnow()
            self.session.add(
                ListingSource(
                    name=payload.name,
                    source_type=payload.source_type,
                    base_url=payload.base_url,
                    legal_status=payload.legal_status,
                    refresh_cadence=payload.refresh_cadence,
                    owner=payload.owner,
                    ingestion_method=payload.ingestion_method,
                    allowed_use_json=payload.allowed_use,
                    robots_txt_url=payload.robots_txt_url,
                    terms_url=payload.terms_url,
                    notes=payload.notes,
                    raw_payload_retention_days=payload.raw_payload_retention_days,
                    private_url_retention_days=payload.private_url_retention_days,
                    retention_notes=payload.retention_notes,
                    is_active=payload.is_active,
                    created_at=now,
                    updated_at=now,
                )
            )
            created = True
        if created:
            self.session.commit()


def _source_id_to_int(source_id: str | None) -> int | None:
    if source_id is None or not source_id.isdigit():
        return None
    return int(source_id)


def _metadata_str(metadata: dict[str, object], key: str) -> str | None:
    value = metadata.get(key)
    return value if isinstance(value, str) and value else None


def _raw_payload_pruned(payload: dict[str, object]) -> bool:
    return payload.get("retention_pruned") is True


def _retention_pruned_payload(
    *,
    original_hash: str,
    source_name: str,
    raw_payload_retention_days: int | None,
    pruned_at: datetime,
) -> dict[str, object]:
    return {
        "retention_pruned": True,
        "pruned_at": pruned_at.isoformat(),
        "source_name": source_name,
        "raw_payload_retention_days": raw_payload_retention_days,
        "original_payload_hash": original_hash,
    }


def _retention_payload_hash(original_hash: str) -> str:
    return f"retention-pruned:{original_hash}"[:128]
