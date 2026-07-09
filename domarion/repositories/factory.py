from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.repositories.postgres import PostgresRealEstateRepository

_memory_repository = InMemoryRealEstateRepository()


def get_repository() -> Iterator[RealEstateRepository]:
    settings = get_settings()

    if settings.data_repository_backend == "memory":
        yield _memory_repository
        return

    if settings.data_repository_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresRealEstateRepository(session)
        finally:
            session.close()
        return

    raise RuntimeError(
        "Unsupported DATA_REPOSITORY_BACKEND. Use 'memory' or 'postgres'."
    )

