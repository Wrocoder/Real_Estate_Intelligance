from typing import Protocol

from domarion.schemas import AuthIdentity, Subscription, SubscriptionUpdate, UserAccount


class AuthStore(Protocol):
    def get_or_create_user(self, identity: AuthIdentity) -> UserAccount:
        raise NotImplementedError

    def get_subscription(self, user_id: str) -> Subscription:
        raise NotImplementedError

    def update_subscription(self, user_id: str, payload: SubscriptionUpdate) -> Subscription:
        raise NotImplementedError
