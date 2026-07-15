from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.news_store.base import NewsStore
from domarion.news_store.memory import InMemoryNewsStore
from domarion.news_store.postgres import PostgresNewsStore

memory_news_store = InMemoryNewsStore()


def get_news_store() -> Iterator[NewsStore]:
    settings = get_settings()

    if settings.news_store_backend == "memory":
        yield memory_news_store
        return

    if settings.news_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresNewsStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported NEWS_STORE_BACKEND. Use 'memory' or 'postgres'.")
