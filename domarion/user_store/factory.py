from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.user_store.base import UserStore
from domarion.user_store.memory import InMemoryUserStore
from domarion.user_store.postgres import PostgresUserStore

memory_user_store = InMemoryUserStore()


def get_user_store() -> Iterator[UserStore]:
    settings = get_settings()

    if settings.user_store_backend == "memory":
        yield memory_user_store
        return

    if settings.user_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresUserStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported USER_STORE_BACKEND. Use 'memory' or 'postgres'.")
