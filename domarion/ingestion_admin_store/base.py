from typing import Protocol

from domarion.ingestion.db_writer import ImportResult
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


class IngestionAdminStore(Protocol):
    def create_job(self, payload: IngestionJobCreate) -> IngestionJob:
        raise NotImplementedError

    def mark_job_running(self, job_id: str) -> IngestionJob | None:
        raise NotImplementedError

    def finish_job(
        self,
        job_id: str,
        result: ImportResult,
        status: IngestionJobStatus = "succeeded",
        errors_count: int = 0,
    ) -> IngestionJob | None:
        raise NotImplementedError

    def list_jobs(self, limit: int = 50) -> list[IngestionJob]:
        raise NotImplementedError

    def get_job(self, job_id: str) -> IngestionJob | None:
        raise NotImplementedError

    def create_quality_log(self, payload: DataQualityLogCreate) -> DataQualityLog:
        raise NotImplementedError

    def list_quality_logs(
        self,
        job_id: str | None = None,
        severity: DataQualitySeverity | None = None,
        limit: int = 100,
    ) -> list[DataQualityLog]:
        raise NotImplementedError

    def list_raw_listings(
        self,
        source_name: str | None = None,
        limit: int = 100,
    ) -> list[RawListingSummary]:
        raise NotImplementedError

    def get_raw_listing(self, raw_listing_id: str) -> RawListingSummary | None:
        raise NotImplementedError

    def list_sources(self) -> list[SourceRegistryEntry]:
        raise NotImplementedError

    def create_source(self, payload: SourceRegistryEntryCreate) -> SourceRegistryEntry:
        raise NotImplementedError

    def update_source(
        self,
        source_id: str,
        payload: SourceRegistryEntryUpdate,
    ) -> SourceRegistryEntry | None:
        raise NotImplementedError
