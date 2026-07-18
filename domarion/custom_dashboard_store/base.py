from typing import Protocol

from domarion.schemas import (
    CustomDashboardConfig,
    CustomDashboardCreate,
    CustomDashboardUpdate,
)


class CustomDashboardStore(Protocol):
    def create_dashboard(
        self,
        owner_id: str,
        payload: CustomDashboardCreate,
    ) -> CustomDashboardConfig:
        raise NotImplementedError

    def list_dashboards(self, owner_id: str, limit: int = 50) -> list[CustomDashboardConfig]:
        raise NotImplementedError

    def get_dashboard(self, owner_id: str, dashboard_id: str) -> CustomDashboardConfig | None:
        raise NotImplementedError

    def update_dashboard(
        self,
        owner_id: str,
        dashboard_id: str,
        payload: CustomDashboardUpdate,
    ) -> CustomDashboardConfig | None:
        raise NotImplementedError

    def delete_dashboard(self, owner_id: str, dashboard_id: str) -> bool:
        raise NotImplementedError
