from datetime import UTC, datetime
from uuid import uuid4

from domarion.schemas import AuthIdentity, Subscription, SubscriptionUpdate, UserAccount


class InMemoryAuthStore:
    def __init__(self) -> None:
        self._users: dict[str, UserAccount] = {}
        self._subscriptions: dict[str, Subscription] = {}

    def get_or_create_user(self, identity: AuthIdentity) -> UserAccount:
        user = self._users.get(identity.user_id)
        now = datetime.now(UTC)

        if user is None:
            user = UserAccount(
                id=identity.user_id,
                email=identity.email,
                display_name=identity.display_name,
                role=identity.role,
                created_at=now,
                updated_at=now,
            )
            self._users[user.id] = user
            self._subscriptions[user.id] = self._build_subscription(user.id, identity.plan, now)
            return user

        update_data = {}
        if identity.email and identity.email != user.email:
            update_data["email"] = identity.email
        if identity.display_name and identity.display_name != user.display_name:
            update_data["display_name"] = identity.display_name
        if identity.role != user.role:
            update_data["role"] = identity.role
        if update_data:
            update_data["updated_at"] = now
            user = user.model_copy(update=update_data)
            self._users[user.id] = user

        if user.id not in self._subscriptions:
            self._subscriptions[user.id] = self._build_subscription(user.id, identity.plan, now)

        return user

    def get_subscription(self, user_id: str) -> Subscription:
        subscription = self._subscriptions.get(user_id)
        if subscription is not None:
            return subscription

        now = datetime.now(UTC)
        subscription = self._build_subscription(user_id, "free", now)
        self._subscriptions[user_id] = subscription
        return subscription

    def update_subscription(self, user_id: str, payload: SubscriptionUpdate) -> Subscription:
        subscription = self.get_subscription(user_id)
        update_data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return subscription

        update_data["updated_at"] = datetime.now(UTC)
        updated = subscription.model_copy(update=update_data)
        self._subscriptions[user_id] = updated
        return updated

    def clear(self) -> None:
        self._users.clear()
        self._subscriptions.clear()

    @staticmethod
    def _build_subscription(user_id: str, plan: str, now: datetime) -> Subscription:
        return Subscription(
            id=str(uuid4()),
            user_id=user_id,
            plan=plan,
            status="active",
            current_period_start=now,
            current_period_end=None,
            created_at=now,
            updated_at=now,
        )
