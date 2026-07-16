import json
import logging
import time
from collections.abc import Awaitable, Callable
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_LOGGER_NAME = "domarion.request"


def configure_logging(log_level: str) -> None:
    level = logging.getLevelName(log_level.upper())
    if not isinstance(level, int):
        level = logging.INFO
    logging.getLogger("domarion").setLevel(level)


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
