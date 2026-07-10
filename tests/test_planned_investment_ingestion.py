import json

from domarion.cli import main
from domarion.ingestion.planned_investments import (
    import_planned_investments,
    read_planned_investment_records,
)
from domarion.repositories.in_memory import InMemoryRealEstateRepository


def test_read_planned_investment_json_normalizes_fields(tmp_path) -> None:
    path = tmp_path / "planned.json"
    _write_json(
        path,
        {
            "source_name": "Official Test Source",
            "items": [
                {
                    "source_id": "wpt-001",
                    "name": "Swojczyce - TAT",
                    "investment_type": "TAT",
                    "status": "Budowa: W realizacji",
                    "city": "Wrocław",
                    "district": "Swojczyce",
                    "expected_year": "2027",
                    "lat": "51,1198",
                    "lon": "17.1067",
                    "source_url": "https://wroclaw.test/wpt",
                    "source_updated_at": "2026-07-02",
                    "confidence_score": "70",
                    "notes": "Manual centroid.",
                }
            ],
        },
    )

    records = read_planned_investment_records(path)

    assert len(records) == 1
    assert records[0].source_id == "wpt-001"
    payload = records[0].payload
    assert payload.investment_type == "tram_bus_priority"
    assert payload.status == "in_progress"
    assert payload.expected_year == 2027
    assert payload.lat == 51.1198
    assert payload.confidence_score == 70
    assert payload.notes is not None
    assert "source=Official Test Source" in payload.notes
    assert "source_updated_at=2026-07-02" in payload.notes


def test_import_planned_investments_is_idempotent_by_name_and_source(tmp_path) -> None:
    path = tmp_path / "planned.json"
    _write_json(
        path,
        [
            {
                "source_id": "wpt-jagodno",
                "name": "Jagodno - TAT",
                "investment_type": "trasa autobusowo-tramwajowa",
                "status": "Projekt: W realizacji",
                "city": "Wrocław",
                "district": "Jagodno",
                "expected_year": 2029,
                "lat": 51.0574,
                "lon": 17.0619,
                "source_url": "https://wroclaw.test/wpt",
            }
        ],
    )
    repository = InMemoryRealEstateRepository()

    first = import_planned_investments(path, repository, default_source_name="WPT")
    second = import_planned_investments(path, repository, default_source_name="WPT")

    assert first.created == 1
    assert first.updated == 0
    assert second.created == 0
    assert second.updated == 1
    matching = [
        investment
        for investment in repository.list_planned_investments(city="Wrocław")
        if investment.name == "Jagodno - TAT"
    ]
    assert len(matching) == 1
    assert matching[0].investment_type == "tram_bus_priority"


def test_cli_import_planned_investments_dry_run(tmp_path, capsys, monkeypatch) -> None:
    path = tmp_path / "planned.json"
    _write_json(
        path,
        [
            {
                "source_id": "wpt-klecina",
                "name": "Klecina - tramwaj",
                "investment_type": "tramwaj",
                "status": "Projekt: W realizacji",
                "city": "Wrocław",
                "lat": 51.0772,
                "lon": 16.9821,
            }
        ],
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "domarion",
            "import-planned-investments",
            str(path),
            "--source-name",
            "Official Test Source",
            "--dry-run",
        ],
    )

    main()

    payload = json.loads(capsys.readouterr().out)
    assert payload["rows_seen"] == 1
    assert payload["dry_run"] is True
    assert payload["source_ids"] == ["wpt-klecina"]
    assert payload["created"] == 0
    assert payload["updated"] == 0


def test_sample_wroclaw_planned_investments_file_is_valid() -> None:
    records = read_planned_investment_records(
        "data/samples/planned_investments_wroclaw_open_data.json"
    )

    assert len(records) >= 5
    assert {record.payload.city for record in records} == {"Wrocław"}
    assert any(record.payload.name == "Psie Pole - tramwaj" for record in records)


def _write_json(path, payload) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
