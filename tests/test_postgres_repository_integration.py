import json
import os
import subprocess
import sys

import pytest

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL is not configured for live Postgres/PostGIS integration tests.",
)


def test_verify_postgres_staging_script() -> None:
    result = subprocess.run(
        [
            sys.executable,
            "scripts/verify_postgres_staging.py",
            "--database-url",
            os.environ["TEST_DATABASE_URL"],
        ],
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout[result.stdout.find("{") :])
    assert payload["status"] == "ok"
    assert "PostgreSQL" in payload["postgres_version"]
    assert "POSTGIS" in payload["postgis_version"]
    assert payload["checks"]["listing_count"] >= 3
    assert payload["checks"]["planned_investment_crud"] == "ok"
