"""Keep source missing-value markers out of geographic scopes."""

MISSING_LOCALITY_MARKERS = frozenset(
    {
        "",
        "-",
        "brak",
        "brak miejscowości",
        "brak miejscowosci",
        "unknown",
        "null",
        "none",
        "n/a",
        "nieznana",
    }
)


def clean_locality(value: str | None) -> str | None:
    text = (value or "").strip()
    marker = text.strip("<>").strip().casefold()
    if marker in MISSING_LOCALITY_MARKERS:
        return None
    return text
