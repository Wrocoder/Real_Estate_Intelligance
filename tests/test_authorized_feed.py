import json
from types import SimpleNamespace

import pytest

from domarion.ingestion.authorized_feed import (
    AuthorizedFeedError,
    import_authorized_feed,
    normalize_authorized_feed_row,
)


def _source(**updates):
    payload = {
        "name": "Wroclaw Agency Feed",
        "source_type": "authorized_feed",
        "base_url": "https://feed.example.test",
        "legal_status": "approved",
        "ingestion_method": "authorized_feed",
        "allowed_use_json": ["analytics", "reports", "price_history"],
        "is_active": True,
        "is_demo": False,
    }
    payload.update(updates)
    return SimpleNamespace(**payload)


def _row(**updates):
    payload = {
        "source_listing_id": "feed-001",
        "source_url": "https://feed.example.test/listings/feed-001",
        "title": "Mieszkanie w Nowym Dworze",
        "city": "Wrocław",
        "district": "Fabryczna",
        "address": "Nowy Dwór 12",
        "market_type": "secondary",
        "price": 690000,
        "area_m2": 59.2,
        "rooms": 3,
        "lat": 51.1117,
        "lon": 16.9653,
        "observed_at": "2026-09-05",
        "building_year": 2014,
        "building_type": "apartment_block",
    }
    payload.update(updates)
    return payload


def test_authorized_feed_normalizes_real_listing_fields_without_guessing_location():
    record = normalize_authorized_feed_row(
        _row(),
        row_number=1,
        source_name="Wroclaw Agency Feed",
        source_type="authorized_feed",
    )

    assert record.listing.city == "Wrocław"
    assert record.listing.district == "Fabryczna"
    assert record.listing.price_per_m2 == 11655
    assert record.listing.building_year == 2014
    assert record.listing.lat == 51.1117


def test_authorized_feed_rejects_region_label_as_district():
    with pytest.raises(AuthorizedFeedError, match="not a Wrocław district"):
        normalize_authorized_feed_row(
            _row(district="dolnośląskie"),
            row_number=1,
            source_name="Wroclaw Agency Feed",
            source_type="authorized_feed",
        )


def test_authorized_feed_rejects_prohibited_content():
    with pytest.raises(AuthorizedFeedError, match="prohibited fields"):
        normalize_authorized_feed_row(
            _row(description="copied portal text"),
            row_number=1,
            source_name="Wroclaw Agency Feed",
            source_type="authorized_feed",
        )


def test_authorized_feed_rejects_unknown_fields_to_protect_raw_storage():
    with pytest.raises(AuthorizedFeedError, match="unsupported fields"):
        normalize_authorized_feed_row(
            _row(seller_company_internal_note="do not retain"),
            row_number=1,
            source_name="Wroclaw Agency Feed",
            source_type="authorized_feed",
        )


def test_authorized_feed_requires_approved_source(tmp_path):
    path = tmp_path / "feed.json"
    path.write_text(json.dumps([_row()]), encoding="utf-8")
    session = SimpleNamespace(scalar=lambda statement: _source(legal_status="review_required"))

    with pytest.raises(AuthorizedFeedError, match="not approved"):
        import_authorized_feed(
            session,
            path,
            source_name="Wroclaw Agency Feed",
            dry_run=True,
        )


def test_authorized_feed_partial_run_does_not_mark_missing_removed(tmp_path, monkeypatch):
    path = tmp_path / "feed.json"
    path.write_text(
        json.dumps([_row(), _row(source_listing_id="feed-002", district="dolnośląskie")]),
        encoding="utf-8",
    )
    session = SimpleNamespace(
        scalar=lambda statement: _source(),
        add=lambda item: None,
        flush=lambda: None,
    )
    captured = {}

    def fake_import(session_arg, records, **kwargs):
        captured["records"] = records
        captured.update(kwargs)
        return SimpleNamespace(
            as_dict=lambda: {
                "rows_seen": len(records),
                "raw_created": 0,
                "raw_updated": 0,
                "properties_created": 0,
                "properties_updated": 0,
                "snapshots_created": 0,
                "snapshots_updated": 0,
            },
            removed_marked=0,
        )

    monkeypatch.setattr(
        "domarion.ingestion.authorized_feed.import_partner_records_in_session",
        fake_import,
    )
    monkeypatch.setattr(
        "domarion.services.market_metrics.refresh_market_metrics",
        lambda session_arg, city: {"status": "updated"},
    )
    result = import_authorized_feed(
        session,
        path,
        source_name="Wroclaw Agency Feed",
        mark_missing_removed=True,
    )

    assert result.rows_accepted == 1
    assert result.rows_rejected == 1
    assert captured["mark_missing_removed"] is False
