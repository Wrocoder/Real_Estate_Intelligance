from typing import Protocol

from domarion.ingestion.db_writer import ImportResult
from domarion.schemas import (
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

    def create_source_check_job(self, payload: SourceCheckJobCreate) -> SourceCheckJob:
        raise NotImplementedError

    def list_source_check_jobs(
        self,
        source_name: str | None = None,
        status: SourceCheckJobStatus | None = None,
        limit: int = 100,
    ) -> list[SourceCheckJob]:
        raise NotImplementedError

    def create_source_error(self, payload: SourceErrorCreate) -> SourceError:
        raise NotImplementedError

    def list_source_errors(
        self,
        source_name: str | None = None,
        status: SourceErrorStatus | None = None,
        severity: DataQualitySeverity | None = None,
        limit: int = 100,
    ) -> list[SourceError]:
        raise NotImplementedError

    def update_source_error(
        self,
        error_id: str,
        payload: SourceErrorUpdate,
    ) -> SourceError | None:
        raise NotImplementedError

    def retry_source_error(
        self,
        error_id: str,
        created_by: str = "system",
    ) -> SourceErrorRetryResult | None:
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

    def prune_retained_raw_payloads(
        self,
        dry_run: bool = True,
        source_name: str | None = None,
        limit: int = 500,
    ) -> SourceRetentionPruneResult:
        raise NotImplementedError

    def create_data_deletion_request(
        self,
        payload: DataDeletionRequestCreate,
        requested_by: str,
    ) -> DataDeletionRequest:
        raise NotImplementedError

    def list_data_deletion_requests(
        self,
        status: DataDeletionRequestStatus | None = None,
        target_type: DataDeletionTargetType | None = None,
        limit: int = 100,
    ) -> list[DataDeletionRequest]:
        raise NotImplementedError

    def get_data_deletion_request(self, request_id: str) -> DataDeletionRequest | None:
        raise NotImplementedError

    def process_data_deletion_request(
        self,
        request_id: str,
        payload: DataDeletionRequestProcess,
        processed_by: str,
    ) -> DataDeletionRequest | None:
        raise NotImplementedError
