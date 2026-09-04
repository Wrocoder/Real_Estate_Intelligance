from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.repositories.base import RealEstateRepository
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.repositories.postgres import PostgresRealEstateRepository

_memory_repositories: dict[bool, InMemoryRealEstateRepository] = {}


def get_memory_repository(*, include_demo_data: bool) -> InMemoryRealEstateRepository:
    repository = _memory_repositories.get(include_demo_data)
    if repository is None:
        repository = InMemoryRealEstateRepository(include_demo_data=include_demo_data)
        _memory_repositories[include_demo_data] = repository
    return repository


def get_repository() -> Iterator[RealEstateRepository]:
    settings = get_settings()

    if settings.data_repository_backend == "memory":
        yield get_memory_repository(include_demo_data=settings.demo_mode_enabled)
        return

    if settings.data_repository_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresRealEstateRepository(
                session,
                include_demo_data=settings.demo_mode_enabled,
            )
        finally:
            session.close()
        return

    raise RuntimeError(
        "Unsupported DATA_REPOSITORY_BACKEND. Use 'memory' or 'postgres'."
    )
