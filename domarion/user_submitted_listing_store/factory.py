from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.user_submitted_listing_store.base import UserSubmittedListingStore
from domarion.user_submitted_listing_store.memory import InMemoryUserSubmittedListingStore
from domarion.user_submitted_listing_store.postgres import PostgresUserSubmittedListingStore

memory_user_submitted_listing_store = InMemoryUserSubmittedListingStore()


def get_user_submitted_listing_store() -> Iterator[UserSubmittedListingStore]:
    settings = get_settings()

    if settings.user_submitted_listing_store_backend == "memory":
        yield memory_user_submitted_listing_store
        return

    if settings.user_submitted_listing_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresUserSubmittedListingStore(session)
        finally:
            session.close()
        return

    raise RuntimeError(
        "Unsupported USER_SUBMITTED_LISTING_STORE_BACKEND. Use 'memory' or 'postgres'."
    )
