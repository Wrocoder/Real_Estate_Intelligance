from typing import Protocol

from domarion.schemas import (
    Alert,
    AlertCreate,
    AlertUpdate,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
)


class UserStore(Protocol):
    def add_favorite(self, owner_id: str, payload: FavoriteCreate) -> Favorite:
        raise NotImplementedError

    def list_favorites(self, owner_id: str) -> list[Favorite]:
        raise NotImplementedError

    def get_favorite(self, owner_id: str, favorite_id: str) -> Favorite | None:
        raise NotImplementedError

    def update_favorite(
        self,
        owner_id: str,
        favorite_id: str,
        payload: FavoriteUpdate,
    ) -> Favorite | None:
        raise NotImplementedError

    def remove_favorite(self, owner_id: str, favorite_id: str) -> bool:
        raise NotImplementedError

    def create_alert(self, owner_id: str, payload: AlertCreate) -> Alert:
        raise NotImplementedError

    def list_alerts(self, owner_id: str) -> list[Alert]:
        raise NotImplementedError

    def get_alert(self, owner_id: str, alert_id: str) -> Alert | None:
        raise NotImplementedError

    def update_alert(self, owner_id: str, alert_id: str, payload: AlertUpdate) -> Alert | None:
        raise NotImplementedError

    def delete_alert(self, owner_id: str, alert_id: str) -> bool:
        raise NotImplementedError

