from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.report_store.base import ReportStore
from domarion.report_store.memory import InMemoryReportStore
from domarion.report_store.postgres import PostgresReportStore

memory_report_store = InMemoryReportStore()


def get_report_store() -> Iterator[ReportStore]:
    settings = get_settings()

    if settings.report_store_backend == "memory":
        yield memory_report_store
        return

    if settings.report_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresReportStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported REPORT_STORE_BACKEND. Use 'memory' or 'postgres'.")

