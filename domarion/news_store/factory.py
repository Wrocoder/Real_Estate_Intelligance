from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.news_store.base import NewsStore
from domarion.news_store.memory import InMemoryNewsStore
from domarion.news_store.postgres import PostgresNewsStore

_memory_news_stores: dict[bool, InMemoryNewsStore] = {}


def get_memory_news_store(*, include_demo_data: bool) -> InMemoryNewsStore:
    store = _memory_news_stores.get(include_demo_data)
    if store is None:
        store = InMemoryNewsStore(include_demo_data=include_demo_data)
        _memory_news_stores[include_demo_data] = store
    return store


memory_news_store = get_memory_news_store(include_demo_data=False)


def get_news_store() -> Iterator[NewsStore]:
    settings = get_settings()

    if settings.news_store_backend == "memory":
        yield get_memory_news_store(include_demo_data=settings.demo_mode_enabled)
        return

    if settings.news_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresNewsStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported NEWS_STORE_BACKEND. Use 'memory' or 'postgres'.")
