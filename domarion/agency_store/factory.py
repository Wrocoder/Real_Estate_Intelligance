from collections.abc import Iterator

from domarion.agency_store.base import AgencyStore
from domarion.agency_store.memory import InMemoryAgencyStore
from domarion.agency_store.postgres import PostgresAgencyStore
from domarion.core import get_settings
from domarion.db.session import SessionLocal

memory_agency_store = InMemoryAgencyStore()


def get_agency_store() -> Iterator[AgencyStore]:
    settings = get_settings()

    if settings.agency_store_backend == "memory":
        yield memory_agency_store
        return

    if settings.agency_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresAgencyStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported AGENCY_STORE_BACKEND. Use 'memory' or 'postgres'.")
