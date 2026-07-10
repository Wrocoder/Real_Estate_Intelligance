from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.report_order_store.base import ReportOrderStore
from domarion.report_order_store.memory import InMemoryReportOrderStore
from domarion.report_order_store.postgres import PostgresReportOrderStore

memory_report_order_store = InMemoryReportOrderStore()


def get_report_order_store() -> Iterator[ReportOrderStore]:
    settings = get_settings()

    if settings.report_order_store_backend == "memory":
        yield memory_report_order_store
        return

    if settings.report_order_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresReportOrderStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported REPORT_ORDER_STORE_BACKEND. Use 'memory' or 'postgres'.")
