from __future__ import annotations

import json
import os
import sys
import time
from collections.abc import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
RETRIES = int(os.getenv("SMOKE_RETRIES", "20"))
SLEEP_SECONDS = float(os.getenv("SMOKE_SLEEP_SECONDS", "1.5"))
TIMEOUT_SECONDS = float(os.getenv("SMOKE_TIMEOUT_SECONDS", "5"))
ADMIN_HEADERS = {
    "X-Domarion-User-Id": "smoke-admin",
    "X-Domarion-Email": "smoke-admin@domarion.local",
    "X-Domarion-Role": "admin",
    "X-Domarion-Plan": "enterprise",
}


def _read_url(url: str, headers: dict[str, str] | None = None) -> tuple[int, bytes]:
    request_headers = {"User-Agent": "domarion-smoke/1.0", **(headers or {})}
    request = Request(url, headers=request_headers)
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.status, response.read()


def _check_with_retry(name: str, checker: Callable[[], None]) -> None:
    last_error: Exception | None = None
    for attempt in range(1, RETRIES + 1):
        try:
            checker()
            print(f"OK {name}")
            return
        except (AssertionError, HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            if attempt < RETRIES:
                time.sleep(SLEEP_SECONDS)
    print(f"FAIL {name}: {last_error}", file=sys.stderr)
    raise SystemExit(1)


def _json_endpoint(
    name: str,
    url: str,
    validator: Callable[[object], None],
    headers: dict[str, str] | None = None,
) -> None:
    def check() -> None:
        status, body = _read_url(url, headers=headers)
        assert 200 <= status < 300, f"HTTP {status}"
        validator(json.loads(body.decode("utf-8")))

    _check_with_retry(name, check)


def _html_endpoint(name: str, url: str) -> None:
    def check() -> None:
        status, body = _read_url(url)
        assert 200 <= status < 300, f"HTTP {status}"
        assert body, "empty response body"

    _check_with_retry(name, check)


def main() -> int:
    _json_endpoint(
        "api health",
        f"{API_BASE_URL}/health",
        lambda payload: assert_dict_value(payload, "status", "ok"),
    )
    _json_endpoint(
        "api readiness",
        f"{API_BASE_URL}/ready",
        lambda payload: assert_readiness_response(payload),
    )
    _json_endpoint(
        "report products",
        f"{API_BASE_URL}/api/v1/report-products",
        lambda payload: assert_non_empty_list(payload),
    )
    _json_endpoint(
        "listings",
        f"{API_BASE_URL}/api/v1/listings",
        lambda payload: assert_search_response(payload),
    )
    _json_endpoint(
        "admin ingestion jobs",
        f"{API_BASE_URL}/api/v1/admin/ingestion/jobs",
        lambda payload: assert_list(payload),
        headers=ADMIN_HEADERS,
    )
    _json_endpoint(
        "admin planned investments",
        f"{API_BASE_URL}/api/v1/admin/planned-investments",
        lambda payload: assert_non_empty_list(payload),
        headers=ADMIN_HEADERS,
    )
    _json_endpoint(
        "alert delivery jobs",
        f"{API_BASE_URL}/api/v1/alert-delivery-jobs",
        lambda payload: assert_list(payload),
    )
    _json_endpoint(
        "payment webhook route",
        f"{API_BASE_URL}/openapi.json",
        lambda payload: assert_openapi_path(payload, "/api/v1/payment-webhooks/{provider}"),
    )

    if FRONTEND_BASE_URL:
        _html_endpoint("frontend pricing", f"{FRONTEND_BASE_URL}/pricing")
        _html_endpoint("frontend admin", f"{FRONTEND_BASE_URL}/admin")
        _html_endpoint("frontend areas", f"{FRONTEND_BASE_URL}/areas")
        _html_endpoint("frontend area detail", f"{FRONTEND_BASE_URL}/areas/wroclaw-fabryczna")
        _html_endpoint("frontend sitemap", f"{FRONTEND_BASE_URL}/sitemap.xml")
        _html_endpoint("frontend robots", f"{FRONTEND_BASE_URL}/robots.txt")

    return 0


def assert_dict_value(payload: object, key: str, expected: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert payload.get(key) == expected, f"expected {key}={expected!r}, got {payload.get(key)!r}"


def assert_non_empty_list(payload: object) -> None:
    assert isinstance(payload, list), "expected JSON list"
    assert len(payload) > 0, "expected non-empty list"


def assert_list(payload: object) -> None:
    assert isinstance(payload, list), "expected JSON list"


def assert_search_response(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert isinstance(payload.get("items"), list), "expected items list"
    assert payload["items"], "expected non-empty items"
    assert payload.get("total", 0) >= len(payload["items"]), "expected valid total"


def assert_readiness_response(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert payload.get("status") in {"ready", "degraded"}, "expected non-blocked readiness"
    assert isinstance(payload.get("checks"), list), "expected readiness checks"
    assert payload["checks"], "expected at least one readiness check"
    assert payload.get("failed_count") == 0, "expected zero failed readiness checks"


def assert_openapi_path(payload: object, path: str) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    paths = payload.get("paths")
    assert isinstance(paths, dict), "expected OpenAPI paths object"
    assert path in paths, f"expected OpenAPI path {path}"


if __name__ == "__main__":
    raise SystemExit(main())
