from collections.abc import Iterator

from domarion.core import get_settings
from domarion.crm_store.base import CrmStore
from domarion.crm_store.memory import InMemoryCrmStore

memory_crm_store = InMemoryCrmStore()


def get_crm_store() -> Iterator[CrmStore]:
    settings = get_settings()

    if settings.crm_store_backend == "memory":
        yield memory_crm_store
        return

    raise RuntimeError("Unsupported CRM_STORE_BACKEND. Use 'memory'.")
