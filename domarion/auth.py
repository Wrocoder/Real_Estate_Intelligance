from dataclasses import dataclass
from datetime import datetime
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, Request, status
from pydantic import ValidationError

from domarion.auth_store.base import AuthStore
from domarion.auth_store.factory import get_auth_store
from domarion.core import Settings
from domarion.schemas import AuthIdentity, PlanLimits, Subscription, UserAccount
from domarion.services.auth_sessions import InvalidSessionError, verify_session_token
from domarion.services.plans import get_plan_limits

AuthStoreDep = Annotated[AuthStore, Depends(get_auth_store)]


@dataclass(frozen=True)
class CurrentAccount:
    user: UserAccount
    subscription: Subscription
    limits: PlanLimits
    session_expires_at: datetime | None = None


def get_current_account(
    request: Request,
    auth_store: AuthStoreDep,
    owner_id: Annotated[str | None, Query(include_in_schema=False)] = None,
    authorization: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[
        str | None, Header(alias="X-Domarion-User-Id", include_in_schema=False)
    ] = None,
    x_email: Annotated[
        str | None, Header(alias="X-Domarion-Email", include_in_schema=False)
    ] = None,
    x_display_name: Annotated[
        str | None, Header(alias="X-Domarion-Display-Name", include_in_schema=False)
    ] = None,
    x_role: Annotated[str | None, Header(alias="X-Domarion-Role", include_in_schema=False)] = None,
    x_plan: Annotated[str | None, Header(alias="X-Domarion-Plan", include_in_schema=False)] = None,
) -> CurrentAccount:
    settings: Settings = request.app.state.settings
    token = _session_token(request, authorization, settings)
    if token:
        try:
            user_id, expires_at = verify_session_token(token, settings.auth_session_secret)
        except InvalidSessionError as exc:
            raise _authentication_error("Session is invalid or expired") from exc
        user = auth_store.get_user(user_id)
        if user is None:
            raise _authentication_error("Session account no longer exists")
        return _account_for_user(auth_store, user, session_expires_at=expires_at)

    if not _demo_identity_allowed(settings):
        raise _authentication_error("Sign in is required")

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

    return _account_for_user(auth_store, auth_store.get_or_create_user(identity))


def _session_token(request: Request, authorization: str | None, settings: Settings) -> str | None:
    if authorization:
        scheme, _, credentials = authorization.partition(" ")
        if scheme.casefold() != "bearer" or not credentials.strip():
            raise _authentication_error("Use a Bearer session token")
        return credentials.strip()
    return request.cookies.get(settings.auth_session_cookie_name)


def _demo_identity_allowed(settings: Settings) -> bool:
    return settings.demo_mode_enabled and settings.environment.strip().casefold() in {
        "local",
        "development",
        "test",
    }


def _account_for_user(
    auth_store: AuthStore,
    user: UserAccount,
    *,
    session_expires_at: datetime | None = None,
) -> CurrentAccount:
    subscription = auth_store.get_subscription(user.id)
    limits = get_plan_limits(subscription.plan)
    return CurrentAccount(
        user=user,
        subscription=subscription,
        limits=limits,
        session_expires_at=session_expires_at,
    )


def _authentication_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


CurrentAccountDep = Annotated[CurrentAccount, Depends(get_current_account)]
