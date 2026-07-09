import csv
import json

import pytest

from domarion.cli import main
from domarion.ingestion.db_writer import payload_hash
from domarion.ingestion.partner_csv import PartnerCsvError, read_partner_csv, slugify


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
    assert records[0].listing.price_per_m2 == 11655
    assert records[0].listing.days_on_market == 8
    assert records[0].listing.data_quality_score < 95


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


def test_payload_hash_is_stable() -> None:
    left = payload_hash({"b": "2", "a": "1"})
    right = payload_hash({"a": "1", "b": "2"})

    assert left == right


def test_slugify_is_ascii() -> None:
    assert slugify("Wrocław - Psie Pole") == "wroclaw-psie-pole"


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


def _write_csv(path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "source_listing_id",
        "title",
        "source_url",
        "city",
        "district",
        "address",
        "market_type",
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
