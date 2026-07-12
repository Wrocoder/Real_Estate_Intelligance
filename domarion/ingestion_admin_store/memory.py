from datetime import datetime
from uuid import uuid4

from domarion.ingestion.db_writer import ImportResult
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.ingestion_admin_store.system_sources import system_source_payloads
from domarion.schemas import (
    DataQualityLog,
    DataQualityLogCreate,
    DataQualitySeverity,
    IngestionJob,
    IngestionJobCreate,
    IngestionJobStatus,
    RawListingSummary,
    SourceRegistryEntry,
    SourceRegistryEntryCreate,
    SourceRegistryEntryUpdate,
)


def _now() -> datetime:
    return datetime.utcnow()


class InMemoryIngestionAdminStore(IngestionAdminStore):
    def __init__(self) -> None:
        self._jobs: dict[str, IngestionJob] = {}
        self._logs: dict[str, DataQualityLog] = {}
        self._raw_listings: dict[str, RawListingSummary] = {}
        self._sources: dict[str, SourceRegistryEntry] = {}
        self._seed_demo()

    def clear(self) -> None:
        self._jobs.clear()
        self._logs.clear()
        self._raw_listings.clear()
        self._sources.clear()

    def reset_demo(self) -> None:
        self.clear()
        self._seed_demo()

    def create_job(self, payload: IngestionJobCreate) -> IngestionJob:
        now = _now()
        job = IngestionJob(
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
            metadata=payload.metadata,
            started_at=now if payload.status == "running" else None,
            finished_at=now if payload.status in {"succeeded", "failed"} else None,
            created_at=now,
            updated_at=now,
        )
        self._jobs[job.id] = job
        return job

    def mark_job_running(self, job_id: str) -> IngestionJob | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        now = _now()
        job = job.model_copy(update={"status": "running", "started_at": now, "updated_at": now})
        self._jobs[job.id] = job
        return job

    def finish_job(
        self,
        job_id: str,
        result: ImportResult,
        status: IngestionJobStatus = "succeeded",
        errors_count: int = 0,
    ) -> IngestionJob | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        now = _now()
        job = job.model_copy(
            update={
                **result.as_dict(),
                "status": status,
                "errors_count": errors_count,
                "finished_at": now,
                "updated_at": now,
            }
        )
        self._jobs[job.id] = job
        return job

    def list_jobs(self, limit: int = 50) -> list[IngestionJob]:
        return sorted(self._jobs.values(), key=lambda item: item.created_at, reverse=True)[:limit]

    def get_job(self, job_id: str) -> IngestionJob | None:
        return self._jobs.get(job_id)

    def create_quality_log(self, payload: DataQualityLogCreate) -> DataQualityLog:
        log = DataQualityLog(
            id=str(uuid4()),
            job_id=payload.job_id,
            source_name=payload.source_name,
            source_listing_id=payload.source_listing_id,
            severity=payload.severity,
            code=payload.code,
            message=payload.message,
            payload=payload.payload,
            created_at=_now(),
        )
        self._logs[log.id] = log
        return log

    def list_quality_logs(
        self,
        job_id: str | None = None,
        severity: DataQualitySeverity | None = None,
        limit: int = 100,
    ) -> list[DataQualityLog]:
        logs = list(self._logs.values())
        if job_id:
            logs = [item for item in logs if item.job_id == job_id]
        if severity:
            logs = [item for item in logs if item.severity == severity]
        return sorted(logs, key=lambda item: item.created_at, reverse=True)[:limit]

    def list_raw_listings(
        self,
        source_name: str | None = None,
        limit: int = 100,
    ) -> list[RawListingSummary]:
        raw_listings = list(self._raw_listings.values())
        if source_name:
            raw_listings = [item for item in raw_listings if item.source_name == source_name]
        return sorted(raw_listings, key=lambda item: item.fetched_at, reverse=True)[:limit]

    def get_raw_listing(self, raw_listing_id: str) -> RawListingSummary | None:
        return self._raw_listings.get(raw_listing_id)

    def list_sources(self) -> list[SourceRegistryEntry]:
        return sorted(self._sources.values(), key=lambda item: item.created_at, reverse=True)

    def create_source(self, payload: SourceRegistryEntryCreate) -> SourceRegistryEntry:
        now = _now()
        source = SourceRegistryEntry(
            id=str(uuid4()),
            name=payload.name,
            source_type=payload.source_type,
            base_url=payload.base_url,
            legal_status=payload.legal_status,
            refresh_cadence=payload.refresh_cadence,
            owner=payload.owner,
            ingestion_method=payload.ingestion_method,
            allowed_use=payload.allowed_use,
            robots_txt_url=payload.robots_txt_url,
            terms_url=payload.terms_url,
            notes=payload.notes,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )
        self._sources[source.id] = source
        return source

    def update_source(
        self,
        source_id: str,
        payload: SourceRegistryEntryUpdate,
    ) -> SourceRegistryEntry | None:
        source = self._sources.get(source_id)
        if source is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        source = source.model_copy(update={**update_data, "updated_at": _now()})
        self._sources[source.id] = source
        return source

    def _seed_demo(self) -> None:
        now = _now()
        self._sources["demo-partner-source"] = SourceRegistryEntry(
            id="demo-partner-source",
            name="Demo Partner",
            source_type="partner_csv",
            base_url="https://example.com",
            legal_status="approved",
            refresh_cadence="manual_upload",
            owner="demo-admin",
            ingestion_method="admin_csv_upload",
            allowed_use=["analytics", "reports", "price_history"],
            robots_txt_url="https://example.com/robots.txt",
            terms_url="https://example.com/terms",
            notes="Demo source that represents a partner-owned CSV feed.",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        self._sources["wroclaw-open-data-source"] = SourceRegistryEntry(
            id="wroclaw-open-data-source",
            name="wroclaw.pl WPT",
            source_type="open_data",
            base_url="https://www.wroclaw.pl",
            legal_status="approved",
            refresh_cadence="monthly",
            owner="city-data",
            ingestion_method="planned_investments_import",
            allowed_use=["map_layers", "analytics"],
            robots_txt_url="https://www.wroclaw.pl/robots.txt",
            terms_url=None,
            notes="Used for public planned investment layers, not active flat listings.",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        for payload in system_source_payloads():
            self._sources[f"system-{payload.source_type}"] = SourceRegistryEntry(
                id=f"system-{payload.source_type}",
                name=payload.name,
                source_type=payload.source_type,
                base_url=payload.base_url,
                legal_status=payload.legal_status,
                refresh_cadence=payload.refresh_cadence,
                owner=payload.owner,
                ingestion_method=payload.ingestion_method,
                allowed_use=payload.allowed_use,
                robots_txt_url=payload.robots_txt_url,
                terms_url=payload.terms_url,
                notes=payload.notes,
                is_active=payload.is_active,
                created_at=now,
                updated_at=now,
            )

        job = IngestionJob(
            id="demo-ingestion-job-1",
            source_name="Demo Partner",
            source_type="partner_csv",
            status="succeeded",
            rows_seen=3,
            raw_created=3,
            raw_updated=0,
            properties_created=3,
            properties_updated=0,
            snapshots_created=3,
            snapshots_updated=0,
            errors_count=1,
            created_by="system",
            notes="Demo ingestion job for local admin UI.",
            metadata={"file_name": "partner_listings_wroclaw.csv"},
            started_at=now,
            finished_at=now,
            created_at=now,
            updated_at=now,
        )
        self._jobs[job.id] = job

        for raw_id, listing_id, quality_score in (
            ("demo-raw-1", "wr-001", 82),
            ("demo-raw-2", "wr-002", 76),
            ("demo-raw-3", "wr-003", 79),
        ):
            self._raw_listings[raw_id] = RawListingSummary(
                id=raw_id,
                source_name="Demo Partner",
                source_listing_id=listing_id,
                source_url=f"https://example.com/listings/{listing_id}",
                fetched_at=now,
                payload_hash=f"demo-hash-{listing_id}",
                raw_payload={
                    "source_listing_id": listing_id,
                    "city": "Wrocław",
                    "data_quality_score": str(quality_score),
                },
            )

        self.create_quality_log(
            DataQualityLogCreate(
                job_id=job.id,
                source_name="Demo Partner",
                source_listing_id="wr-002",
                severity="warning",
                code="missing_optional_infrastructure",
                message="Some infrastructure distance fields were missing in the source CSV.",
                payload={"missing_fields": ["nearest_school_m"]},
            )
        )
