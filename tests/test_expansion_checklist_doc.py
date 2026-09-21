from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_poland_city_expansion_checklist_covers_required_gates_and_sources() -> None:
    document = (ROOT / "docs" / "poland_city_expansion_checklist.md").read_text(encoding="utf-8")

    for section in (
        "## City Readiness Gates",
        "## Data-Source Checklist",
        "## City Scoring Card",
        "## Recommended Polish City Order",
        "## Definition Of Done",
        "## Official Source References",
    ):
        assert section in document

    for source in (
        "GUS BDL API",
        "GUGiK/Geoportal",
        "Geoportal RCN",
        "GTFS",
        "MPZP/Studium",
    ):
        assert source in document


def test_poland_expansion_checklist_is_indexed_without_claiming_live_coverage() -> None:
    index = (ROOT / "docs" / "README.md").read_text(encoding="utf-8")

    assert "[City expansion checklist](poland_city_expansion_checklist.md)" in index
    assert "not a current geographic coverage inventory" in index
