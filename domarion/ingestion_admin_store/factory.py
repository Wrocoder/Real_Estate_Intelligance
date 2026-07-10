from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.ingestion_admin_store.memory import InMemoryIngestionAdminStore
from domarion.ingestion_admin_store.postgres import PostgresIngestionAdminStore

memory_ingestion_admin_store = InMemoryIngestionAdminStore()


def get_ingestion_admin_store() -> Iterator[IngestionAdminStore]:
    settings = get_settings()

    if settings.ingestion_admin_store_backend == "memory":
        yield memory_ingestion_admin_store
        return

    if settings.ingestion_admin_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresIngestionAdminStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported INGESTION_ADMIN_STORE_BACKEND. Use 'memory' or 'postgres'.")
