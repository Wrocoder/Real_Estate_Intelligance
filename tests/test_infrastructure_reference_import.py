from pathlib import Path

import pytest

from domarion.ingestion.infrastructure_references import (
    InfrastructureReferenceImportError,
    dry_run_infrastructure_references,
    read_infrastructure_reference_records,
)

SAMPLE_PATH = Path("data/samples/infrastructure_references_wroclaw_open_data.json")


def test_read_infrastructure_reference_records_from_sample() -> None:
    records = read_infrastructure_reference_records(SAMPLE_PATH)

    assert len(records) == 7
    assert [record.layer for record in records] == [
        "transport_stops",
        "transport_routes",
        "schools",
        "kindergartens",
        "amenities",
        "amenities",
        "industrial_zones",
    ]
    assert records[0].item.id == "wro-stop-nowydwor-rondo"
    assert records[0].item.metadata["source_name"] == "Wroclaw official open-data sample"
    assert records[0].item.metadata["infrastructure_layer"] == "transport_stops"
    assert records[1].item.stop_ids == ["wro-stop-nowydwor-rondo"]
    assert records[5].item.metadata["infrastructure_layer"] == "amenities"


def test_dry_run_infrastructure_references_counts_layers() -> None:
    result = dry_run_infrastructure_references(SAMPLE_PATH)

    assert result.rows_seen == 7
    assert result.dry_run is True
    assert result.layer_counts == {
        "transport_stops": 1,
        "transport_routes": 1,
        "schools": 1,
        "kindergartens": 1,
        "amenities": 2,
        "industrial_zones": 1,
    }
    assert "wro-amenity-healthcare-fabryczna-demo" in result.item_ids


def test_csv_import_can_use_default_layer(tmp_path: Path) -> None:
    csv_path = tmp_path / "schools.csv"
    csv_path.write_text(
        "\n".join(
            [
                "id,municipality_id,municipality_name,district_id,name,type,lat,lon",
                "school-1,wroclaw,Wrocław,wroclaw-krzyki,SP Krzyki,primary,51.08,17.04",
            ]
        ),
        encoding="utf-8",
    )

    records = read_infrastructure_reference_records(
        csv_path,
        default_layer="schools",
        default_source_name="CSV school source",
    )

    assert len(records) == 1
    assert records[0].layer == "schools"
    assert records[0].item.name == "SP Krzyki"
    assert records[0].item.school_type == "primary"
    assert records[0].item.metadata["source_name"] == "CSV school source"


def test_infrastructure_import_rejects_unknown_layer(tmp_path: Path) -> None:
    json_path = tmp_path / "bad.json"
    json_path.write_text(
        '{"items":[{"layer":"unknown","municipality_id":"wroclaw","name":"Bad"}]}',
        encoding="utf-8",
    )

    with pytest.raises(
        InfrastructureReferenceImportError,
        match="unsupported infrastructure layer",
    ):
        read_infrastructure_reference_records(json_path)
