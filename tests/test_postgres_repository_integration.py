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
    assert payload["checks"]["listing_event_count"] >= 3
    assert "first_seen" in payload["checks"]["listing_event_types"]
    assert "price_reduced" in payload["checks"]["listing_event_types"]
    assert payload["checks"]["deduplication"]["decision"] == "matched"
    assert payload["checks"]["deduplication"]["review_status"] == "auto_resolved"
    assert payload["checks"]["deduplication"]["match_score"] >= 95
    assert payload["checks"]["location_references"]["municipality_count"] >= 1
    assert payload["checks"]["location_references"]["district_count"] >= 3
    assert payload["checks"]["location_references"]["query_count"] >= 1
    assert payload["checks"]["infrastructure"]["transport_stop_count"] >= 2
    assert payload["checks"]["infrastructure"]["transport_route_count"] >= 2
    assert payload["checks"]["infrastructure"]["school_count"] >= 1
    assert payload["checks"]["infrastructure"]["kindergarten_count"] >= 2
    assert payload["checks"]["infrastructure"]["amenity_count"] >= 1
    assert payload["checks"]["infrastructure"]["industrial_zone_count"] >= 1
    assert (
        payload["checks"]["infrastructure"]["spatial"]["infrastructure_spatial_index_count"]
        == 5
    )
    assert payload["checks"]["spatial"]["properties_with_geom"] >= 3
    assert payload["checks"]["spatial"]["planned_investments_with_geom"] >= 4
    assert payload["checks"]["spatial"]["spatial_index_count"] == 2
    assert payload["checks"]["spatial"]["nearby_listing_ids"] == ["wr-001"]
    assert payload["checks"]["spatial"]["nearby_planned_investment_count"] >= 1
    assert payload["checks"]["spatial"]["created_planned_investment_geom"]["srid"] == 4326
    assert payload["checks"]["spatial"]["updated_planned_investment_geom"]["srid"] == 4326
