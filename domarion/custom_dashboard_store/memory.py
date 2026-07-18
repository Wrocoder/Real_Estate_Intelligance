from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    CustomDashboardConfig,
    CustomDashboardCreate,
    CustomDashboardUpdate,
)


class InMemoryCustomDashboardStore:
    def __init__(self) -> None:
        self._dashboards: dict[str, CustomDashboardConfig] = {}

    def create_dashboard(
        self,
        owner_id: str,
        payload: CustomDashboardCreate,
    ) -> CustomDashboardConfig:
        now = datetime.now(UTC)
        dashboard = CustomDashboardConfig(
            id=str(uuid4()),
            owner_id=owner_id,
            name=payload.name,
            description=payload.description,
            audience=payload.audience,
            city=payload.city,
            district=payload.district,
            widget_codes=payload.widget_codes,
            filters=payload.filters,
            refresh_interval_minutes=payload.refresh_interval_minutes,
            is_default=payload.is_default,
            shared_with_agency_ids=payload.shared_with_agency_ids,
            notes=payload.notes,
            created_at=now,
            updated_at=now,
        )
        if dashboard.is_default:
            self._clear_default(owner_id)
        self._dashboards[dashboard.id] = dashboard
        return dashboard

    def list_dashboards(self, owner_id: str, limit: int = 50) -> list[CustomDashboardConfig]:
        dashboards = [
            dashboard
            for dashboard in self._dashboards.values()
            if dashboard.owner_id == owner_id
        ]
        return sorted(
            dashboards,
            key=lambda item: (item.is_default, item.updated_at),
            reverse=True,
        )[:limit]

    def get_dashboard(self, owner_id: str, dashboard_id: str) -> CustomDashboardConfig | None:
        dashboard = self._dashboards.get(dashboard_id)
        if dashboard is None or dashboard.owner_id != owner_id:
            return None
        return dashboard

    def update_dashboard(
        self,
        owner_id: str,
        dashboard_id: str,
        payload: CustomDashboardUpdate,
    ) -> CustomDashboardConfig | None:
        dashboard = self.get_dashboard(owner_id, dashboard_id)
        if dashboard is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        update_data = _normalized_update_data(update_data)
        if not update_data:
            return dashboard

        update_data["updated_at"] = datetime.now(UTC)
        updated = dashboard.model_copy(update=update_data)
        if updated.is_default:
            self._clear_default(owner_id, exclude_dashboard_id=dashboard_id)
        self._dashboards[dashboard_id] = updated
        return updated

    def delete_dashboard(self, owner_id: str, dashboard_id: str) -> bool:
        dashboard = self.get_dashboard(owner_id, dashboard_id)
        if dashboard is None:
            return False
        del self._dashboards[dashboard_id]
        return True

    def clear(self) -> None:
        self._dashboards.clear()

    def _clear_default(
        self,
        owner_id: str,
        *,
        exclude_dashboard_id: str | None = None,
    ) -> None:
        now = datetime.now(UTC)
        for dashboard_id, dashboard in list(self._dashboards.items()):
            if dashboard.owner_id != owner_id or dashboard_id == exclude_dashboard_id:
                continue
            if not dashboard.is_default:
                continue
            self._dashboards[dashboard_id] = dashboard.model_copy(
                update={"is_default": False, "updated_at": now}
            )


def _normalized_update_data(data: dict[str, object]) -> dict[str, object]:
    normalized = dict(data)
    for key in (
        "name",
        "audience",
        "widget_codes",
        "refresh_interval_minutes",
        "is_default",
    ):
        if normalized.get(key) is None:
            normalized.pop(key, None)
    if normalized.get("filters") is None:
        normalized.pop("filters", None)
    if normalized.get("shared_with_agency_ids") is None:
        normalized.pop("shared_with_agency_ids", None)
    return normalized
