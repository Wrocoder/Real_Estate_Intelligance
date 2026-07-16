from scripts.performance_smoke import (
    DEFAULT_CASES,
    InProcessSmokeClient,
    SmokeResult,
    run_smoke,
)


def test_performance_smoke_runs_default_cases_in_process() -> None:
    results = run_smoke(
        InProcessSmokeClient(),
        DEFAULT_CASES,
        repeat=1,
        threshold_multiplier=100,
    )

    assert {result.name for result in results} == {
        "health",
        "listing search",
        "hidden gems search",
        "map features",
    }
    assert all(result.passed for result in results)


def test_performance_smoke_result_detects_threshold_failure() -> None:
    result = SmokeResult(
        name="slow endpoint",
        samples_ms=(25.0, 30.0),
        avg_ms=27.5,
        p95_ms=30.0,
        max_avg_ms=20.0,
        max_p95_ms=50.0,
    )

    assert result.passed is False
