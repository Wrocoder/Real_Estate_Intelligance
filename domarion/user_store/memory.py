from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import (
    Alert,
    AlertCreate,
    AlertUpdate,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
)


class InMemoryUserStore:
    def __init__(self) -> None:
        self._favorites: dict[str, Favorite] = {}
        self._alerts: dict[str, Alert] = {}

    def add_favorite(self, owner_id: str, payload: FavoriteCreate) -> Favorite:
        existing = self._find_favorite_by_listing(owner_id, payload.listing_id)
        if existing is not None:
            return self.update_favorite(
                owner_id,
                existing.id,
                FavoriteUpdate(note=payload.note),
            ) or existing

        favorite = Favorite(
            id=str(uuid4()),
            owner_id=owner_id,
            listing_id=payload.listing_id,
            note=payload.note,
            created_at=datetime.now(UTC),
        )
        self._favorites[favorite.id] = favorite
        return favorite

    def list_favorites(self, owner_id: str) -> list[Favorite]:
        favorites = [item for item in self._favorites.values() if item.owner_id == owner_id]
        return sorted(favorites, key=lambda item: item.created_at, reverse=True)

    def get_favorite(self, owner_id: str, favorite_id: str) -> Favorite | None:
        favorite = self._favorites.get(favorite_id)
        if favorite is None or favorite.owner_id != owner_id:
            return None
        return favorite

    def update_favorite(
        self,
        owner_id: str,
        favorite_id: str,
        payload: FavoriteUpdate,
    ) -> Favorite | None:
        favorite = self.get_favorite(owner_id, favorite_id)
        if favorite is None:
            return None

        updated = favorite.model_copy(update={"note": payload.note})
        self._favorites[favorite_id] = updated
        return updated

    def remove_favorite(self, owner_id: str, favorite_id: str) -> bool:
        favorite = self.get_favorite(owner_id, favorite_id)
        if favorite is None:
            return False
        del self._favorites[favorite_id]
        return True

    def create_alert(self, owner_id: str, payload: AlertCreate) -> Alert:
        now = datetime.now(UTC)
        alert = Alert(
            id=str(uuid4()),
            owner_id=owner_id,
            name=payload.name,
            filters=payload.filters,
            channel=payload.channel,
            frequency=payload.frequency,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        self._alerts[alert.id] = alert
        return alert

    def list_alerts(self, owner_id: str) -> list[Alert]:
        alerts = [item for item in self._alerts.values() if item.owner_id == owner_id]
        return sorted(alerts, key=lambda item: item.created_at, reverse=True)

    def get_alert(self, owner_id: str, alert_id: str) -> Alert | None:
        alert = self._alerts.get(alert_id)
        if alert is None or alert.owner_id != owner_id:
            return None
        return alert

    def update_alert(self, owner_id: str, alert_id: str, payload: AlertUpdate) -> Alert | None:
        alert = self.get_alert(owner_id, alert_id)
        if alert is None:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if "filters" in update_data and update_data["filters"] is not None:
            update_data["filters"] = payload.filters
        update_data["updated_at"] = datetime.now(UTC)

        updated = alert.model_copy(update=update_data)
        self._alerts[alert_id] = updated
        return updated

    def delete_alert(self, owner_id: str, alert_id: str) -> bool:
        alert = self.get_alert(owner_id, alert_id)
        if alert is None:
            return False
        del self._alerts[alert_id]
        return True

    def clear(self) -> None:
        self._favorites.clear()
        self._alerts.clear()

    def _find_favorite_by_listing(self, owner_id: str, listing_id: str) -> Favorite | None:
        for favorite in self._favorites.values():
            if favorite.owner_id == owner_id and favorite.listing_id == listing_id:
                return favorite
        return None

