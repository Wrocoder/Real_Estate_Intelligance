from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.report_artifacts.factory import get_report_artifact_store
from domarion.report_store.artifact_backed import ArtifactBackedReportStore
from domarion.report_store.base import ReportStore
from domarion.report_store.memory import InMemoryReportStore
from domarion.report_store.postgres import PostgresReportStore

memory_report_store = InMemoryReportStore()


def get_report_store() -> Iterator[ReportStore]:
    settings = get_settings()
    artifact_store = get_report_artifact_store()

    if settings.report_store_backend == "memory":
        yield _with_artifact_storage(memory_report_store, artifact_store)
        return

    if settings.report_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield _with_artifact_storage(PostgresReportStore(session), artifact_store)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported REPORT_STORE_BACKEND. Use 'memory' or 'postgres'.")


def _with_artifact_storage(report_store: ReportStore, artifact_store) -> ReportStore:
    if artifact_store is None:
        return report_store
    return ArtifactBackedReportStore(report_store, artifact_store)
