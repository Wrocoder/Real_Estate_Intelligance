from collections.abc import Iterator

from domarion.ai_insight_store.base import AIInsightStore
from domarion.ai_insight_store.memory import InMemoryAIInsightStore
from domarion.ai_insight_store.postgres import PostgresAIInsightStore
from domarion.core import get_settings
from domarion.db.session import SessionLocal

memory_ai_insight_store = InMemoryAIInsightStore()


def get_ai_insight_store() -> Iterator[AIInsightStore]:
    settings = get_settings()

    if settings.ai_insight_store_backend == "memory":
        yield memory_ai_insight_store
        return

    if settings.ai_insight_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresAIInsightStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported AI_INSIGHT_STORE_BACKEND. Use 'memory' or 'postgres'.")
