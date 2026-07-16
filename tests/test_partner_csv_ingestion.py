import csv
import hashlib
import json
from datetime import date
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace

import pytest

from domarion.cli import main
from domarion.ingestion.db_writer import (
    _description_hash_from_record,
    _evaluate_deduplication_candidate,
    _is_duplicate_property_match,
    _listing_snapshot_payload,
    payload_hash,
)
from domarion.ingestion.partner_csv import PartnerCsvError, read_partner_csv, slugify
from domarion.schemas import Listing


def test_read_partner_csv_normalizes_listing(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-001",
                "title": "Mieszkanie testowe",
                "source_url": "https://agency.test/p-001",
                "city": "Wrocław",
                "district": "Fabryczna",
                "address": "Nowy Dwór",
                "market_type": "secondary",
                "voivodeship": "dolnoslaskie",
                "building_type": "apartment_block",
                "renovation_state": "ready_to_move_in",
                "has_balcony": "tak",
                "has_elevator": "true",
                "parking_type": "underground",
                "heating_type": "municipal",
                "price": "690000",
                "area_m2": "59,2",
                "rooms": "3",
                "lat": "51.1117",
                "lon": "16.9653",
                "first_seen_at": "2026-07-01",
                "last_seen_at": "2026-07-09",
                "observed_at": "2026-07-09",
                "nearest_stop_m": "260",
            }
        ],
    )

    records = read_partner_csv(path, default_source_name="Test Agency")

    assert len(records) == 1
    assert records[0].source_name == "Test Agency"
    assert records[0].listing.id == "p-001"
    assert records[0].listing.area_id == "wroclaw-fabryczna"
    assert records[0].listing.voivodeship == "dolnoslaskie"
    assert records[0].listing.building_type == "apartment_block"
    assert records[0].listing.renovation_state == "ready_to_move_in"
    assert records[0].listing.has_balcony is True
    assert records[0].listing.has_elevator is True
    assert records[0].listing.parking_type == "underground"
    assert records[0].listing.heating_type == "municipal"
    assert records[0].listing.price_per_m2 == 11655
    assert records[0].listing.days_on_market == 8
    assert records[0].listing.data_quality_score < 95


def test_partner_listing_snapshot_payload_keeps_status_and_description_hash(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-removed",
                "title": "Mieszkanie testowe",
                "source_url": "https://agency.test/p-removed",
                "city": "Wrocław",
                "district": "Fabryczna",
                "address": "Nowy Dwór",
                "market_type": "secondary",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
                "lat": "51.1117",
                "lon": "16.9653",
                "active_status": "sold",
                "description_hash": "desc-hash-v1",
            }
        ],
    )

    record = read_partner_csv(path, default_source_name="Test Agency")[0]
    payload = _listing_snapshot_payload(record)

    assert payload["active_status"] == "removed"
    assert payload["description_hash"] == "desc-hash-v1"
    assert "description" not in payload


def test_partner_listing_description_text_is_hashed_for_events(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-description",
                "title": "Mieszkanie testowe",
                "source_url": "https://agency.test/p-description",
                "city": "Wrocław",
                "district": "Fabryczna",
                "address": "Nowy Dwór",
                "market_type": "secondary",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
                "lat": "51.1117",
                "lon": "16.9653",
                "description": "  Jasne mieszkanie  z balkonem.  ",
            }
        ],
    )

    record = read_partner_csv(path, default_source_name="Test Agency")[0]

    expected_hash = hashlib.sha256(b"Jasne mieszkanie z balkonem.").hexdigest()
    assert _description_hash_from_record(record) == expected_hash


def test_read_partner_csv_rejects_missing_required_columns(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    path.write_text("source_listing_id,title\np-001,Missing fields\n", encoding="utf-8")

    with pytest.raises(PartnerCsvError, match="missing required columns"):
        read_partner_csv(path, default_source_name="Test Agency")


def test_read_partner_csv_rejects_invalid_market_type(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-001",
                "title": "Mieszkanie testowe",
                "source_url": "https://agency.test/p-001",
                "city": "Wrocław",
                "district": "Fabryczna",
                "address": "Nowy Dwór",
                "market_type": "rent",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
                "lat": "51.1117",
                "lon": "16.9653",
            }
        ],
    )

    with pytest.raises(PartnerCsvError, match="market_type"):
        read_partner_csv(path, default_source_name="Test Agency")


def test_read_partner_csv_geocodes_missing_coordinates(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-geo-001",
                "title": "Mieszkanie geocoded",
                "source_url": "https://agency.test/p-geo-001",
                "city": "Wrocław",
                "district": "Krzyki",
                "address": "Jagodno Wrocław",
                "market_type": "secondary",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
            }
        ],
    )

    record = read_partner_csv(path, default_source_name="Test Agency")[0]

    assert record.listing.lat == 51.0592
    assert record.listing.lon == 17.0641
    assert 35 <= record.listing.data_quality_score <= 72
    assert record.raw_payload["geocoding_provider"] == "offline_wroclaw_v1"
    assert record.raw_payload["geocoding_precision"] == "neighborhood"


def test_suburban_partner_sample_parses_as_legal_feed() -> None:
    path = Path("data/samples/partner_listings_suburban.csv")

    records = read_partner_csv(path, default_source_name="Demo Suburban Partner Feed")

    assert len(records) == 11
    assert {record.source_type for record in records} == {"partner_csv"}
    assert {record.listing.area_id for record in records} >= {
        "medlow-medlow",
        "kobierzyce-kobierzyce",
        "wysoka-wysoka",
        "bielany-wroclawskie-bielany-wroclawskie",
        "olawa-olawa",
    }
    assert all(record.listing.source_name == "Demo Suburban Partner Feed" for record in records)


def test_read_partner_csv_rejects_unresolved_missing_coordinates(tmp_path) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-geo-missing",
                "title": "Mieszkanie missing coordinates",
                "source_url": "https://agency.test/p-geo-missing",
                "city": "Poznań",
                "district": "Wilda",
                "address": "Nieznany adres",
                "market_type": "secondary",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
            }
        ],
    )

    with pytest.raises(PartnerCsvError, match="offline geocoding"):
        read_partner_csv(path, default_source_name="Test Agency")


def test_payload_hash_is_stable() -> None:
    left = payload_hash({"b": "2", "a": "1"})
    right = payload_hash({"a": "1", "b": "2"})

    assert left == right


def test_slugify_is_ascii() -> None:
    assert slugify("Wrocław - Psie Pole") == "wroclaw-psie-pole"


def test_partner_import_dedup_match_accepts_strict_same_property() -> None:
    listing = _dedup_listing(address="Nowy Dwór 12")
    existing_property = _dedup_property(canonical_address="ul. Nowy Dwór 12")

    assert _is_duplicate_property_match(existing_property, listing)


@pytest.mark.parametrize(
    "property_updates",
    [
        {"canonical_address": "Inna 12"},
        {"area_m2": Decimal("65.0")},
        {"lat": Decimal("51.1400")},
    ],
)
def test_partner_import_dedup_match_rejects_weak_matches(property_updates) -> None:
    listing = _dedup_listing(address="Nowy Dwór 12")
    existing_property = _dedup_property(**property_updates)

    assert not _is_duplicate_property_match(existing_property, listing)


def test_partner_import_dedup_explains_review_required_match() -> None:
    listing = _dedup_listing(address="Nowy Dwór 12")
    existing_property = _dedup_property(id=123, lat=Decimal("51.1400"))

    decision = _evaluate_deduplication_candidate(existing_property, listing)

    assert decision.property_id == 123
    assert decision.decision == "review_required"
    assert decision.match_score == 90
    assert "coordinates differ beyond tolerance" in decision.reasons
    assert decision.candidate_payload["property_id"] == 123


def test_partner_import_dedup_explains_rejected_match() -> None:
    listing = _dedup_listing(address="Nowy Dwór 12")
    existing_property = _dedup_property(
        id=124,
        canonical_address="Inna 12",
        area_m2=Decimal("84.0"),
        lat=Decimal("51.1400"),
    )

    decision = _evaluate_deduplication_candidate(existing_property, listing)

    assert decision.decision == "rejected"
    assert decision.match_score < 70
    assert "address differs after normalization" in decision.reasons
    assert "area differs beyond tolerance" in decision.reasons


def test_cli_import_partner_csv_dry_run(tmp_path, capsys, monkeypatch) -> None:
    path = tmp_path / "partner.csv"
    _write_csv(
        path,
        [
            {
                "source_listing_id": "p-001",
                "title": "Mieszkanie testowe",
                "source_url": "https://agency.test/p-001",
                "city": "Wrocław",
                "district": "Fabryczna",
                "address": "Nowy Dwór",
                "market_type": "secondary",
                "price": "690000",
                "area_m2": "59.2",
                "rooms": "3",
                "lat": "51.1117",
                "lon": "16.9653",
            }
        ],
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "domarion",
            "import-partner-csv",
            str(path),
            "--source-name",
            "Test Agency",
            "--dry-run",
        ],
    )

    main()

    payload = json.loads(capsys.readouterr().out)
    assert payload == {"rows_seen": 1, "listing_ids": ["p-001"], "dry_run": True}


def _dedup_listing(**updates) -> Listing:
    payload = {
        "id": "dedup-candidate",
        "title": "Dedup candidate",
        "source_name": "Test Agency",
        "source_url": "https://agency.test/dedup-candidate",
        "city": "Wrocław",
        "district": "Fabryczna",
        "area_id": "wroclaw-fabryczna",
        "municipality": "Wrocław",
        "address": "Nowy Dwór 12",
        "market_type": "secondary",
        "price": 690000,
        "currency": "PLN",
        "area_m2": 59.2,
        "price_per_m2": 11655,
        "rooms": 3,
        "floor": None,
        "building_floors": None,
        "building_year": None,
        "first_seen_at": date(2026, 7, 1),
        "last_seen_at": date(2026, 7, 9),
        "days_on_market": 8,
        "price_reductions": 0,
        "price_increases": 0,
        "relisted": False,
        "lat": 51.1117,
        "lon": 16.9653,
        "distance_to_center_km": 0.0,
        "nearest_stop_m": 260,
        "nearest_school_m": 9999,
        "nearest_major_road_m": 9999,
        "nearest_industrial_zone_m": 9999,
        "parks_within_1km": 0,
        "schools_within_1km": 0,
        "planned_investments_within_2km": 0,
        "data_quality_score": 85,
    }
    payload.update(updates)
    return Listing(**payload)


def _dedup_property(**updates) -> SimpleNamespace:
    payload = {
        "canonical_address": "ul. Nowy Dwór 12",
        "city": "Wrocław",
        "district": "Fabryczna",
        "market_type": "secondary",
        "area_m2": Decimal("59.0"),
        "rooms": 3,
        "lat": Decimal("51.1118"),
        "lon": Decimal("16.9652"),
    }
    payload.update(updates)
    return SimpleNamespace(**payload)


def _write_csv(path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "source_listing_id",
        "title",
        "source_url",
        "city",
        "district",
        "address",
        "market_type",
        "voivodeship",
        "building_type",
        "renovation_state",
        "has_balcony",
        "has_terrace",
        "has_garden",
        "has_elevator",
        "parking_type",
        "heating_type",
        "active_status",
        "description_hash",
        "description",
        "price",
        "area_m2",
        "rooms",
        "lat",
        "lon",
        "first_seen_at",
        "last_seen_at",
        "observed_at",
        "nearest_stop_m",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
