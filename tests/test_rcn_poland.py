from datetime import datetime
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

import pytest

from domarion.ingestion.rcn_poland import (
    DEFAULT_POLAND_REGION_CODES,
    RcnRegionCheckpoint,
    build_rcn_region_url,
    checkpoint_since_version,
    combine_rcn_region_results,
    load_rcn_region_checkpoints,
    parse_region_codes,
    voivodeship_for_teryt,
)
from domarion.ingestion.rcn_transactions import _teryt_prefix_from_url


def test_build_rcn_region_url_uses_bounded_official_filters() -> None:
    url = build_rcn_region_url(
        "https://mapy.geoportal.gov.pl/wss/service/rcn?service=WFS&BBOX=old",
        teryt_prefix="12",
        since_version="2026-08-01T00:00:00",
    )

    query = parse_qs(urlparse(url).query)
    assert "BBOX" not in query
    assert query["typeNames"] == ["ms:lokale"]
    assert query["count"] == ["1000"]
    assert "<fes:Literal>12*</fes:Literal>" in query["FILTER"][0]
    assert "<fes:Literal>mieszkalna</fes:Literal>" in query["FILTER"][0]
    assert "<fes:Literal>2026-08-01T00:00:00</fes:Literal>" in query["FILTER"][0]

    assert _teryt_prefix_from_url(url) == "12"


def test_poland_region_configuration_is_complete_and_validated() -> None:
    assert len(DEFAULT_POLAND_REGION_CODES) == 16
    assert parse_region_codes("all") == DEFAULT_POLAND_REGION_CODES
    assert parse_region_codes("12,14,12") == ("12", "14")
    assert voivodeship_for_teryt("0264") == "dolnośląskie"
    assert voivodeship_for_teryt("1261") == "małopolskie"
    assert voivodeship_for_teryt("99") is None
    with pytest.raises(ValueError, match="Unknown Polish voivodeship"):
        parse_region_codes("02,99")


def test_region_checkpoint_uses_overlap_and_initial_window() -> None:
    initial = datetime(2025, 1, 1)
    assert checkpoint_since_version(None, initial_since=initial, overlap_days=14) == (
        "2025-01-01T00:00:00"
    )
    checkpoint = RcnRegionCheckpoint("12", "2026-08-10T14:23:36")
    assert checkpoint_since_version(
        checkpoint,
        initial_since=initial,
        overlap_days=14,
    ) == "2026-07-27T14:23:36"


def test_load_region_checkpoints_keeps_latest_success_per_region() -> None:
    latest_finished_at = datetime(2026, 8, 11, 8)
    jobs = [
        SimpleNamespace(
            metadata_json={"teryt_prefix": "12", "latest_source_version": "2026-08-10"},
            finished_at=latest_finished_at,
            updated_at=latest_finished_at,
        ),
        SimpleNamespace(
            metadata_json={"teryt_prefix": "12", "latest_source_version": "2026-07-01"},
            finished_at=datetime(2026, 7, 2, 8),
            updated_at=datetime(2026, 7, 2, 8),
        ),
        SimpleNamespace(
            metadata_json={"teryt_prefix": "14", "latest_source_version": "2026-08-09"},
            finished_at=datetime(2026, 8, 10, 8),
            updated_at=datetime(2026, 8, 10, 8),
        ),
    ]
    session = SimpleNamespace(scalars=lambda statement: SimpleNamespace(all=lambda: jobs))

    checkpoints = load_rcn_region_checkpoints(session, source_name="RCN GUGiK")

    assert checkpoints["12"].latest_source_version == "2026-08-10"
    assert checkpoints["12"].last_successful_at == latest_finished_at
    assert checkpoints["14"].latest_source_version == "2026-08-09"


def test_combine_region_results_preserves_region_evidence() -> None:
    combined = combine_rcn_region_results(
        [
            {
                "rows_seen": 10,
                "rows_accepted": 8,
                "rows_rejected": 2,
                "transactions_created": 3,
                "district_assignments_reset": 2,
                "rejection_reason_counts": {"invalid": 2},
                "accepted_snapshot_fingerprint": "aaa",
                "latest_source_version": "2026-08-10",
                "latest_transaction_date": "2026-07-24",
            },
            {
                "rows_seen": 20,
                "rows_accepted": 20,
                "transactions_reconfirmed": 20,
                "accepted_snapshot_fingerprint": "bbb",
                "latest_source_version": "2026-08-11",
                "latest_transaction_date": "2026-07-25",
            },
        ]
    )

    assert combined["regions_processed"] == 2
    assert combined["rows_seen"] == 30
    assert combined["rows_accepted"] == 28
    assert combined["district_assignments_reset"] == 2
    assert combined["rejection_reason_counts"] == {"invalid": 2}
    assert combined["latest_source_version"] == "2026-08-11"
    assert len(combined["accepted_snapshot_fingerprint"]) == 64
