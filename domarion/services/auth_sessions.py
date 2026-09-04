from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

PASSWORD_ITERATIONS = 600_000
SESSION_VERSION = 1
DUMMY_PASSWORD_HASH = (
    "pbkdf2_sha256$600000$ZG9tYXJpb24tbG9naW4h$IrbQ7HMnf8bJX3-lg2LjxSaTLpheQn4ym21lefAp664"
)


class InvalidSessionError(ValueError):
    pass


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${_encode(salt)}${_encode(digest)}"


def verify_password(password: str, encoded: str | None) -> bool:
    if not encoded:
        return False
    try:
        algorithm, iterations_raw, salt_raw, digest_raw = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
        if iterations < 100_000 or iterations > 2_000_000:
            return False
        salt = _decode(salt_raw)
        expected = _decode(digest_raw)
    except (TypeError, ValueError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual, expected)


def create_session_token(user_id: str, secret: str, ttl_seconds: int) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(seconds=ttl_seconds)
    payload = {
        "v": SESSION_VERSION,
        "sub": user_id,
        "exp": int(expires_at.timestamp()),
        "nonce": secrets.token_urlsafe(12),
    }
    encoded_payload = _encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(secret.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256)
    return f"{encoded_payload}.{_encode(signature.digest())}", expires_at


def verify_session_token(token: str, secret: str) -> tuple[str, datetime]:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(
            secret.encode("utf-8"), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected_signature, _decode(encoded_signature)):
            raise InvalidSessionError("Invalid session signature")
        payload = json.loads(_decode(encoded_payload))
        if payload.get("v") != SESSION_VERSION or not isinstance(payload.get("sub"), str):
            raise InvalidSessionError("Invalid session payload")
        expires_at = datetime.fromtimestamp(int(payload["exp"]), tz=UTC)
    except InvalidSessionError:
        raise
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise InvalidSessionError("Invalid session token") from exc
    if expires_at <= datetime.now(UTC):
        raise InvalidSessionError("Session expired")
    return payload["sub"], expires_at


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
