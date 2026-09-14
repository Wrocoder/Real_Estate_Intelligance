import pytest

from domarion.location_names import clean_locality


@pytest.mark.parametrize(
    "value",
    [
        None,
        "",
        "   ",
        "-",
        "brak",
        "<brak miejscowości>",
        "< BRAK MIEJSCOWOSCI >",
        "unknown",
        "null",
        "none",
        "n/a",
        "nieznana",
    ],
)
def test_clean_locality_rejects_missing_value_markers(value: str | None) -> None:
    assert clean_locality(value) is None


def test_clean_locality_preserves_name_and_trims_surrounding_whitespace() -> None:
    assert clean_locality("  Kraków  ") == "Kraków"
