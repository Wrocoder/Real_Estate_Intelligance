from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import Subscription as SubscriptionModel
from domarion.db.models import User as UserModel
from domarion.schemas import AuthIdentity, Subscription, SubscriptionUpdate, UserAccount


class PostgresAuthStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_or_create_user(self, identity: AuthIdentity) -> UserAccount:
        user = self.session.get(UserModel, identity.user_id)
        now = datetime.utcnow()

        if user is None:
            user = UserModel(
                id=identity.user_id,
                email=identity.email,
                display_name=identity.display_name,
                role=identity.role,
                created_at=now,
                updated_at=now,
            )
            self.session.add(user)
            self.session.flush()
            self._create_subscription(user.id, identity.plan, now)
            self.session.commit()
            self.session.refresh(user)
            return self._user_from_row(user)

        changed = False
        if identity.email and identity.email != user.email:
            user.email = identity.email
            changed = True
        if identity.display_name and identity.display_name != user.display_name:
            user.display_name = identity.display_name
            changed = True
        if identity.role != user.role:
            user.role = identity.role
            changed = True
        if changed:
            user.updated_at = now

        if self._subscription_row(user.id) is None:
            self._create_subscription(user.id, identity.plan, now)
            changed = True

        if changed:
            self.session.commit()
            self.session.refresh(user)

        return self._user_from_row(user)

    def get_subscription(self, user_id: str) -> Subscription:
        row = self._subscription_row(user_id)
        if row is None:
            row = self._create_subscription(user_id, "free", datetime.utcnow())
            self.session.commit()
            self.session.refresh(row)
        return self._subscription_from_row(row)

    def update_subscription(self, user_id: str, payload: SubscriptionUpdate) -> Subscription:
        row = self._subscription_row(user_id)
        if row is None:
            row = self._create_subscription(user_id, "free", datetime.utcnow())

        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "plan" in update_data:
            row.plan = update_data["plan"]
        if "status" in update_data:
            row.status = update_data["status"]
        row.updated_at = datetime.utcnow()

        self.session.commit()
        self.session.refresh(row)
        return self._subscription_from_row(row)

    def _subscription_row(self, user_id: str) -> SubscriptionModel | None:
        return self.session.scalar(
            select(SubscriptionModel).where(SubscriptionModel.user_id == user_id)
        )

    def _create_subscription(
        self,
        user_id: str,
        plan: str,
        now: datetime,
    ) -> SubscriptionModel:
        row = SubscriptionModel(
            id=str(uuid4()),
            user_id=user_id,
            plan=plan,
            status="active",
            current_period_start=now,
            current_period_end=None,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        return row

    @staticmethod
    def _user_from_row(row: UserModel) -> UserAccount:
        return UserAccount(
            id=row.id,
            email=row.email,
            display_name=row.display_name,
            role=row.role,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _subscription_from_row(row: SubscriptionModel) -> Subscription:
        return Subscription(
            id=row.id,
            user_id=row.user_id,
            plan=row.plan,
            status=row.status,
            current_period_start=row.current_period_start,
            current_period_end=row.current_period_end,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
