from collections.abc import Iterator

from domarion.core import get_settings
from domarion.custom_dashboard_store.base import CustomDashboardStore
from domarion.custom_dashboard_store.memory import InMemoryCustomDashboardStore

memory_custom_dashboard_store = InMemoryCustomDashboardStore()


def get_custom_dashboard_store() -> Iterator[CustomDashboardStore]:
    settings = get_settings()

    if settings.custom_dashboard_store_backend == "memory":
        yield memory_custom_dashboard_store
        return

    raise RuntimeError("Unsupported CUSTOM_DASHBOARD_STORE_BACKEND. Use 'memory'.")
