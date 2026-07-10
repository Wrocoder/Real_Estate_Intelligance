from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query
from pydantic import ValidationError

from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.core import get_settings
from domarion.schemas import AuthIdentity, PlanLimits, Subscription, UserAccount
from domarion.services.plans import get_plan_limits

AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]


@dataclass(frozen=True)
class CurrentAccount:
    user: UserAccount
    subscription: Subscription
    limits: PlanLimits


def get_current_account(
    auth_store: AuthStoreDep,
    owner_id: Annotated[
        str | None,
        Query(
            description=(
                "Deprecated MVP fallback. Prefer X-Domarion-User-Id header once auth is wired."
            )
        ),
    ] = None,
    x_user_id: Annotated[str | None, Header(alias="X-Domarion-User-Id")] = None,
    x_email: Annotated[str | None, Header(alias="X-Domarion-Email")] = None,
    x_display_name: Annotated[str | None, Header(alias="X-Domarion-Display-Name")] = None,
    x_role: Annotated[str | None, Header(alias="X-Domarion-Role")] = None,
    x_plan: Annotated[str | None, Header(alias="X-Domarion-Plan")] = None,
) -> CurrentAccount:
    settings = get_settings()
    user_id = x_user_id or owner_id or settings.demo_user_id

    try:
        default_email = settings.demo_user_email if user_id == settings.demo_user_id else None
        identity = AuthIdentity(
            user_id=user_id,
            email=x_email or default_email,
            display_name=x_display_name,
            role=x_role or "buyer",
            plan=x_plan or "free",
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.errors()) from exc

    user = auth_store.get_or_create_user(identity)
    subscription = auth_store.get_subscription(user.id)
    limits = get_plan_limits(subscription.plan)
    return CurrentAccount(user=user, subscription=subscription, limits=limits)


CurrentAccountDep = Annotated[CurrentAccount, Depends(get_current_account)]
