from collections.abc import Iterator

from domarion.auth_store.base import AuthStore
from domarion.auth_store.memory import InMemoryAuthStore
from domarion.auth_store.postgres import PostgresAuthStore
from domarion.core import get_settings
from domarion.db.session import SessionLocal

memory_auth_store = InMemoryAuthStore()


def get_auth_store() -> Iterator[AuthStore]:
    settings = get_settings()

    if settings.auth_store_backend == "memory":
        yield memory_auth_store
        return

    if settings.auth_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresAuthStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported AUTH_STORE_BACKEND. Use 'memory' or 'postgres'.")
