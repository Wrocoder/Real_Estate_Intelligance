from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Protocol
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

Params = tuple[tuple[str, str], ...]

DEFAULT_REPEAT = int(os.getenv("PERF_SMOKE_REPEAT", "5"))
DEFAULT_TIMEOUT_SECONDS = float(os.getenv("PERF_SMOKE_TIMEOUT_SECONDS", "5"))
DEFAULT_THRESHOLD_MULTIPLIER = float(os.getenv("PERF_SMOKE_THRESHOLD_MULTIPLIER", "1"))


class SmokeClient(Protocol):
    def get_json(self, path: str, params: Params) -> tuple[int, object]:
        """Return HTTP status and decoded JSON payload."""


@dataclass(frozen=True)
class EndpointCase:
    name: str
    path: str
    params: Params
    validator: Callable[[object], None]
    max_avg_ms: float
    max_p95_ms: float


@dataclass(frozen=True)
class SmokeResult:
    name: str
    samples_ms: tuple[float, ...]
    avg_ms: float
    p95_ms: float
    max_avg_ms: float
    max_p95_ms: float

    @property
    def passed(self) -> bool:
        return self.avg_ms <= self.max_avg_ms and self.p95_ms <= self.max_p95_ms


class InProcessSmokeClient:
    def __init__(self) -> None:
        from fastapi.testclient import TestClient

        from domarion.main import app

        self._client = TestClient(app)

    def get_json(self, path: str, params: Params) -> tuple[int, object]:
        response = self._client.get(path, params=dict(params))
        payload = response.json() if response.content else None
        return response.status_code, payload


class HttpSmokeClient:
    def __init__(self, base_url: str, timeout_seconds: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    def get_json(self, path: str, params: Params) -> tuple[int, object]:
        query = urlencode(params)
        url = f"{self.base_url}{path}"
        if query:
            url = f"{url}?{query}"
        request = Request(url, headers={"User-Agent": "domarion-performance-smoke/1.0"})
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            try:
                return exc.code, json.loads(body)
            except json.JSONDecodeError:
                return exc.code, body


def run_smoke(
    client: SmokeClient,
    cases: Sequence[EndpointCase] | None = None,
    *,
    repeat: int = DEFAULT_REPEAT,
    threshold_multiplier: float = DEFAULT_THRESHOLD_MULTIPLIER,
) -> list[SmokeResult]:
    if repeat < 1:
        raise ValueError("repeat must be at least 1")
    if threshold_multiplier <= 0:
        raise ValueError("threshold_multiplier must be greater than 0")

    selected_cases = DEFAULT_CASES if cases is None else cases
    return [
        run_case(
            client,
            case,
            repeat=repeat,
            threshold_multiplier=threshold_multiplier,
        )
        for case in selected_cases
    ]


def run_case(
    client: SmokeClient,
    case: EndpointCase,
    *,
    repeat: int,
    threshold_multiplier: float,
) -> SmokeResult:
    samples_ms: list[float] = []
    for _ in range(repeat):
        started_at = time.perf_counter()
        status_code, payload = client.get_json(case.path, case.params)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        assert 200 <= status_code < 300, f"{case.name}: expected 2xx, got HTTP {status_code}"
        case.validator(payload)
        samples_ms.append(elapsed_ms)

    return SmokeResult(
        name=case.name,
        samples_ms=tuple(samples_ms),
        avg_ms=sum(samples_ms) / len(samples_ms),
        p95_ms=_nearest_rank_percentile(samples_ms, 95),
        max_avg_ms=case.max_avg_ms * threshold_multiplier,
        max_p95_ms=case.max_p95_ms * threshold_multiplier,
    )


def assert_health_payload(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert payload.get("status") == "ok", "expected healthy API response"


def assert_search_response(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    items = payload.get("items")
    assert isinstance(items, list), "expected items list"
    assert items, "expected non-empty listing search results"
    total = payload.get("total")
    assert isinstance(total, int), "expected integer total"
    assert total >= len(items), "expected total to cover returned items"


def assert_hidden_gems_response(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert isinstance(payload.get("items"), list), "expected items list"
    assert isinstance(payload.get("total"), int), "expected integer total"


def assert_map_feature_collection(payload: object) -> None:
    assert isinstance(payload, dict), "expected JSON object"
    assert payload.get("type") == "FeatureCollection", "expected GeoJSON FeatureCollection"
    features = payload.get("features")
    assert isinstance(features, list), "expected features list"
    assert features, "expected non-empty map features"
    metadata = payload.get("metadata")
    assert isinstance(metadata, dict), "expected map metadata"
    assert metadata.get("listing_count", 0) >= 1, "expected listing features"


def _nearest_rank_percentile(samples: Sequence[float], percentile: int) -> float:
    if not samples:
        raise ValueError("samples must not be empty")
    ordered = sorted(samples)
    index = max(0, math.ceil((percentile / 100) * len(ordered)) - 1)
    return ordered[index]


DEFAULT_CASES: tuple[EndpointCase, ...] = (
    EndpointCase(
        name="health",
        path="/health",
        params=(),
        validator=assert_health_payload,
        max_avg_ms=250,
        max_p95_ms=500,
    ),
    EndpointCase(
        name="listing search",
        path="/api/v1/listings",
        params=(
            ("city", "Wrocław"),
            ("page", "1"),
            ("page_size", "20"),
            ("sort", "investment_score_desc"),
        ),
        validator=assert_search_response,
        max_avg_ms=1000,
        max_p95_ms=2500,
    ),
    EndpointCase(
        name="hidden gems search",
        path="/api/v1/listings/hidden-gems",
        params=(
            ("city", "Wrocław"),
            ("max_price_delta_to_fair_mid_pct", "50"),
            ("min_investment_score", "0"),
            ("max_risk_score", "100"),
            ("min_liquidity_score", "0"),
            ("min_rental_potential_score", "0"),
            ("min_data_quality_score", "0"),
            ("page_size", "20"),
        ),
        validator=assert_hidden_gems_response,
        max_avg_ms=1500,
        max_p95_ms=3500,
    ),
    EndpointCase(
        name="map features",
        path="/api/v1/map/features",
        params=(
            ("city", "Wrocław"),
            ("bbox", "16.90,51.05,17.10,51.20"),
        ),
        validator=assert_map_feature_collection,
        max_avg_ms=1500,
        max_p95_ms=3500,
    ),
)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run lightweight API performance smoke checks.")
    parser.add_argument(
        "--base-url",
        default=os.getenv("API_BASE_URL"),
        help="Optional running API base URL. If omitted, the FastAPI app is exercised in-process.",
    )
    parser.add_argument("--repeat", type=int, default=DEFAULT_REPEAT)
    parser.add_argument(
        "--threshold-multiplier",
        type=float,
        default=DEFAULT_THRESHOLD_MULTIPLIER,
        help="Scale all avg/p95 thresholds for slower environments.",
    )
    parser.add_argument("--timeout-seconds", type=float, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--json", action="store_true", help="Emit machine-readable results.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    client: SmokeClient
    mode: str
    if args.base_url:
        client = HttpSmokeClient(args.base_url, timeout_seconds=args.timeout_seconds)
        mode = f"http {args.base_url.rstrip('/')}"
    else:
        client = InProcessSmokeClient()
        mode = "in-process"

    results = run_smoke(
        client,
        repeat=args.repeat,
        threshold_multiplier=args.threshold_multiplier,
    )
    if args.json:
        print(json.dumps(_results_payload(mode, results), ensure_ascii=False, indent=2))
    else:
        _print_results(mode, results)

    return 0 if all(result.passed for result in results) else 1


def _results_payload(mode: str, results: Sequence[SmokeResult]) -> dict[str, object]:
    return {
        "mode": mode,
        "passed": all(result.passed for result in results),
        "results": [
            {
                "name": result.name,
                "passed": result.passed,
                "avg_ms": round(result.avg_ms, 2),
                "p95_ms": round(result.p95_ms, 2),
                "max_avg_ms": result.max_avg_ms,
                "max_p95_ms": result.max_p95_ms,
                "samples_ms": [round(sample, 2) for sample in result.samples_ms],
            }
            for result in results
        ],
    }


def _print_results(mode: str, results: Sequence[SmokeResult]) -> None:
    print(f"Performance smoke mode={mode}")
    for result in results:
        status = "OK" if result.passed else "FAIL"
        print(
            f"{status} {result.name}: "
            f"avg={result.avg_ms:.1f}ms <= {result.max_avg_ms:.0f}ms, "
            f"p95={result.p95_ms:.1f}ms <= {result.max_p95_ms:.0f}ms"
        )


if __name__ == "__main__":
    raise SystemExit(main())
