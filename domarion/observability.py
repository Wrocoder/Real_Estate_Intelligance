import json
import logging
import time
from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_LOGGER_NAME = "domarion.request"
ERROR_TRACKING_LOGGER_NAME = "domarion.error_tracking"
SENTRY_REQUEST_KEYS_TO_DROP = {"cookies", "data", "env", "headers", "query_string"}


def configure_logging(log_level: str) -> None:
    level = logging.getLevelName(log_level.upper())
    if not isinstance(level, int):
        level = logging.INFO
    logging.getLogger("domarion").setLevel(level)


def configure_error_tracking(
    *,
    dsn: str | None,
    environment: str,
    release: str,
    traces_sample_rate: float,
) -> bool:
    if not dsn:
        return False

    logger = logging.getLogger(ERROR_TRACKING_LOGGER_NAME)
    try:
        import sentry_sdk
    except ImportError:
        logger.warning("sentry_sdk_missing")
        return False

    try:
        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            release=release,
            traces_sample_rate=traces_sample_rate,
            send_default_pii=False,
            before_send=_sanitize_sentry_event,
        )
    except Exception:
        logger.warning("sentry_init_failed", exc_info=True)
        return False

    logger.info("sentry_initialized")
    return True


class StructuredRequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        service_name: str,
        environment: str,
    ) -> None:
        super().__init__(app)
        self.service_name = service_name
        self.environment = environment
        self.logger = logging.getLogger(REQUEST_LOGGER_NAME)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = _request_id(request)
        started_at = time.perf_counter()
        status_code = 500
        error_type: str | None = None
        response: Response | None = None

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            error_type = exc.__class__.__name__
            raise
        finally:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            if response is not None:
                response.headers[REQUEST_ID_HEADER] = request_id
            self._log_request(
                request=request,
                request_id=request_id,
                status_code=status_code,
                duration_ms=duration_ms,
                error_type=error_type,
            )

    def _log_request(
        self,
        *,
        request: Request,
        request_id: str,
        status_code: int,
        duration_ms: float,
        error_type: str | None,
    ) -> None:
        payload: dict[str, object] = {
            "event": "http_request_completed" if error_type is None else "http_request_failed",
            "service": self.service_name,
            "environment": self.environment,
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query": request.url.query,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "client_host": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }
        if error_type:
            payload["error_type"] = error_type
        self.logger.info(json.dumps(payload, ensure_ascii=False, sort_keys=True))


def _request_id(request: Request) -> str:
    raw_value = request.headers.get(REQUEST_ID_HEADER)
    if raw_value:
        return raw_value[:128]
    return uuid4().hex


def _sanitize_sentry_event(event: dict, hint: dict | None = None) -> dict:
    request_data = event.get("request")
    if not isinstance(request_data, dict):
        return event

    for key in SENTRY_REQUEST_KEYS_TO_DROP:
        request_data.pop(key, None)

    url = request_data.get("url")
    if isinstance(url, str):
        request_data["url"] = _strip_url_query(url)
    return event


def _strip_url_query(url: str) -> str:
    try:
        parts = urlsplit(url)
        return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
    except ValueError:
        return url.split("?", maxsplit=1)[0]
