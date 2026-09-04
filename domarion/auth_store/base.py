from typing import Protocol

from domarion.schemas import AuthIdentity, Subscription, SubscriptionUpdate, UserAccount


class AuthStore(Protocol):
    def get_user(self, user_id: str) -> UserAccount | None:
        raise NotImplementedError

    def get_user_by_email(self, email: str) -> UserAccount | None:
        raise NotImplementedError

    def create_password_user(self, identity: AuthIdentity, password_hash: str) -> UserAccount:
        raise NotImplementedError

    def get_password_hash(self, user_id: str) -> str | None:
        raise NotImplementedError

    def get_or_create_user(self, identity: AuthIdentity) -> UserAccount:
        raise NotImplementedError

    def get_subscription(self, user_id: str) -> Subscription:
        raise NotImplementedError

    def update_subscription(self, user_id: str, payload: SubscriptionUpdate) -> Subscription:
        raise NotImplementedError
