from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, Response, status

from domarion.auth import AuthStoreDep, CurrentAccountDep
from domarion.core import Settings
from domarion.schemas import (
    AuthCredentials,
    AuthIdentity,
    AuthRegistration,
    AuthSession,
    UserAccount,
)
from domarion.services.auth_sessions import (
    DUMMY_PASSWORD_HASH,
    create_session_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
def register(
    payload: AuthRegistration,
    request: Request,
    response: Response,
    auth_store: AuthStoreDep,
) -> AuthSession:
    identity = AuthIdentity(
        user_id=str(uuid4()),
        email=payload.email,
        display_name=payload.display_name,
        role="buyer",
        plan="free",
    )
    try:
        user = auth_store.create_password_user(identity, hash_password(payload.password))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return _start_session(request, response, user)


@router.post("/login", response_model=AuthSession)
def login(
    payload: AuthCredentials,
    request: Request,
    response: Response,
    auth_store: AuthStoreDep,
) -> AuthSession:
    user = auth_store.get_user_by_email(payload.email)
    password_hash = auth_store.get_password_hash(user.id) if user else DUMMY_PASSWORD_HASH
    password_matches = verify_password(payload.password, password_hash)
    if user is None or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _start_session(request, response, user)


@router.get("/session", response_model=AuthSession)
def session(request: Request, account: CurrentAccountDep) -> AuthSession:
    settings: Settings = request.app.state.settings
    expires_at = account.session_expires_at or (
        datetime.now(UTC) + timedelta(seconds=settings.auth_session_ttl_seconds)
    )
    return AuthSession(
        user=account.user,
        expires_at=expires_at,
        demo_mode=settings.demo_mode_enabled,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response) -> Response:
    settings: Settings = request.app.state.settings
    response.delete_cookie(
        settings.auth_session_cookie_name,
        path="/",
        secure=_secure_cookie(settings),
        httponly=True,
        samesite="lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


def _start_session(request: Request, response: Response, user: UserAccount) -> AuthSession:
    settings: Settings = request.app.state.settings
    token, expires_at = create_session_token(
        user.id,
        settings.auth_session_secret,
        settings.auth_session_ttl_seconds,
    )
    response.set_cookie(
        settings.auth_session_cookie_name,
        token,
        max_age=settings.auth_session_ttl_seconds,
        expires=expires_at,
        path="/",
        secure=_secure_cookie(settings),
        httponly=True,
        samesite="lax",
    )
    return AuthSession(user=user, expires_at=expires_at, demo_mode=settings.demo_mode_enabled)


def _secure_cookie(settings: Settings) -> bool:
    return settings.environment.strip().casefold() not in {"local", "development", "test"}
