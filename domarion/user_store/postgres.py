from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import AlertDeliveryJob as AlertDeliveryJobModel
from domarion.db.models import UserAlert as UserAlertModel
from domarion.db.models import UserFavorite as UserFavoriteModel
from domarion.schemas import (
    Alert,
    AlertCreate,
    AlertDeliveryJob,
    AlertFilters,
    AlertUpdate,
    Favorite,
    FavoriteCreate,
    FavoriteUpdate,
)


class PostgresUserStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add_favorite(self, owner_id: str, payload: FavoriteCreate) -> Favorite:
        row = self.session.scalar(
            select(UserFavoriteModel).where(
                UserFavoriteModel.owner_id == owner_id,
                UserFavoriteModel.listing_id == payload.listing_id,
            )
        )
        if row is None:
            row = UserFavoriteModel(
                id=str(uuid4()),
                owner_id=owner_id,
                listing_id=payload.listing_id,
                note=payload.note,
                created_at=datetime.utcnow(),
            )
            self.session.add(row)
        else:
            row.note = payload.note

        self.session.commit()
        self.session.refresh(row)
        return self._favorite_from_row(row)

    def list_favorites(self, owner_id: str) -> list[Favorite]:
        rows = self.session.scalars(
            select(UserFavoriteModel)
            .where(UserFavoriteModel.owner_id == owner_id)
            .order_by(UserFavoriteModel.created_at.desc())
        ).all()
        return [self._favorite_from_row(row) for row in rows]

    def get_favorite(self, owner_id: str, favorite_id: str) -> Favorite | None:
        row = self.session.get(UserFavoriteModel, favorite_id)
        if row is None or row.owner_id != owner_id:
            return None
        return self._favorite_from_row(row)

    def update_favorite(
        self,
        owner_id: str,
        favorite_id: str,
        payload: FavoriteUpdate,
    ) -> Favorite | None:
        row = self.session.get(UserFavoriteModel, favorite_id)
        if row is None or row.owner_id != owner_id:
            return None
        row.note = payload.note
        self.session.commit()
        self.session.refresh(row)
        return self._favorite_from_row(row)

    def remove_favorite(self, owner_id: str, favorite_id: str) -> bool:
        row = self.session.get(UserFavoriteModel, favorite_id)
        if row is None or row.owner_id != owner_id:
            return False
        self.session.delete(row)
        self.session.commit()
        return True

    def create_alert(self, owner_id: str, payload: AlertCreate) -> Alert:
        now = datetime.utcnow()
        row = UserAlertModel(
            id=str(uuid4()),
            owner_id=owner_id,
            name=payload.name,
            channel=payload.channel,
            frequency=payload.frequency,
            delivery_target=payload.delivery_target,
            filters=payload.filters.model_dump(exclude_none=True),
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._alert_from_row(row)

    def list_alerts(self, owner_id: str) -> list[Alert]:
        rows = self.session.scalars(
            select(UserAlertModel)
            .where(UserAlertModel.owner_id == owner_id)
            .order_by(UserAlertModel.created_at.desc())
        ).all()
        return [self._alert_from_row(row) for row in rows]

    def get_alert(self, owner_id: str, alert_id: str) -> Alert | None:
        row = self.session.get(UserAlertModel, alert_id)
        if row is None or row.owner_id != owner_id:
            return None
        return self._alert_from_row(row)

    def update_alert(self, owner_id: str, alert_id: str, payload: AlertUpdate) -> Alert | None:
        row = self.session.get(UserAlertModel, alert_id)
        if row is None or row.owner_id != owner_id:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if "name" in update_data:
            row.name = update_data["name"]
        if "channel" in update_data:
            row.channel = update_data["channel"]
        if "frequency" in update_data:
            row.frequency = update_data["frequency"]
        if "delivery_target" in update_data:
            row.delivery_target = update_data["delivery_target"]
        if "filters" in update_data and payload.filters is not None:
            row.filters = payload.filters.model_dump(exclude_none=True)
        if "is_active" in update_data:
            row.is_active = update_data["is_active"]
        row.updated_at = datetime.utcnow()

        self.session.commit()
        self.session.refresh(row)
        return self._alert_from_row(row)

    def delete_alert(self, owner_id: str, alert_id: str) -> bool:
        row = self.session.get(UserAlertModel, alert_id)
        if row is None or row.owner_id != owner_id:
            return False
        self.session.delete(row)
        self.session.commit()
        return True

    def save_alert_delivery_job(self, job: AlertDeliveryJob) -> AlertDeliveryJob:
        row = AlertDeliveryJobModel(
            id=job.id,
            owner_id=job.owner_id,
            alert_id=job.alert_id,
            channel=job.channel,
            provider=job.provider,
            status=job.status,
            total_matches=job.total_matches,
            delivered_count=job.delivered_count,
            message=job.message,
            listing_ids=job.listing_ids,
            metadata_json=job.metadata,
            created_at=job.created_at,
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._delivery_job_from_row(row)

    def list_alert_delivery_jobs(
        self,
        owner_id: str,
        limit: int = 50,
    ) -> list[AlertDeliveryJob]:
        rows = self.session.scalars(
            select(AlertDeliveryJobModel)
            .where(AlertDeliveryJobModel.owner_id == owner_id)
            .order_by(AlertDeliveryJobModel.created_at.desc())
            .limit(limit)
        ).all()
        return [self._delivery_job_from_row(row) for row in rows]

    @staticmethod
    def _favorite_from_row(row: UserFavoriteModel) -> Favorite:
        return Favorite(
            id=row.id,
            owner_id=row.owner_id,
            listing_id=row.listing_id,
            note=row.note,
            created_at=row.created_at,
        )

    @staticmethod
    def _alert_from_row(row: UserAlertModel) -> Alert:
        return Alert(
            id=row.id,
            owner_id=row.owner_id,
            name=row.name,
            filters=AlertFilters(**row.filters),
            channel=row.channel,
            frequency=row.frequency,
            delivery_target=row.delivery_target,
            is_active=row.is_active,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _delivery_job_from_row(row: AlertDeliveryJobModel) -> AlertDeliveryJob:
        return AlertDeliveryJob(
            id=row.id,
            owner_id=row.owner_id,
            alert_id=row.alert_id,
            channel=row.channel,
            provider=row.provider,
            status=row.status,
            total_matches=row.total_matches,
            delivered_count=row.delivered_count,
            message=row.message,
            listing_ids=row.listing_ids,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )
