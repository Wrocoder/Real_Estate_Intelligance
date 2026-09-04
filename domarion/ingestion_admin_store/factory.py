from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.ingestion_admin_store.base import IngestionAdminStore
from domarion.ingestion_admin_store.memory import InMemoryIngestionAdminStore
from domarion.ingestion_admin_store.postgres import PostgresIngestionAdminStore

_memory_ingestion_admin_stores: dict[bool, InMemoryIngestionAdminStore] = {}


def get_memory_ingestion_admin_store(
    *, include_demo_data: bool
) -> InMemoryIngestionAdminStore:
    store = _memory_ingestion_admin_stores.get(include_demo_data)
    if store is None:
        store = InMemoryIngestionAdminStore(include_demo_data=include_demo_data)
        _memory_ingestion_admin_stores[include_demo_data] = store
    return store


def get_ingestion_admin_store() -> Iterator[IngestionAdminStore]:
    settings = get_settings()

    if settings.ingestion_admin_store_backend == "memory":
        yield get_memory_ingestion_admin_store(
            include_demo_data=settings.demo_mode_enabled
        )
        return

    if settings.ingestion_admin_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresIngestionAdminStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported INGESTION_ADMIN_STORE_BACKEND. Use 'memory' or 'postgres'.")
