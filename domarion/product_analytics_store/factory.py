from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.product_analytics_store.base import ProductAnalyticsStore
from domarion.product_analytics_store.memory import InMemoryProductAnalyticsStore
from domarion.product_analytics_store.postgres import PostgresProductAnalyticsStore

memory_product_analytics_store = InMemoryProductAnalyticsStore()


def get_product_analytics_store() -> Iterator[ProductAnalyticsStore]:
    backend = get_settings().product_analytics_store_backend
    if backend == "memory":
        yield memory_product_analytics_store
        return
    if backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresProductAnalyticsStore(session)
        finally:
            session.close()
        return
    raise RuntimeError("Unsupported PRODUCT_ANALYTICS_STORE_BACKEND. Use 'memory' or 'postgres'.")
