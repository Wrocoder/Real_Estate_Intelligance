from domarion.schemas import Listing


def matches_lifestyle_filters(
    listing: Listing,
    *,
    has_balcony: bool | None = None,
    has_terrace: bool | None = None,
    has_garden: bool | None = None,
    has_elevator: bool | None = None,
    parking_type: str | None = None,
    heating_type: str | None = None,
) -> bool:
    if not _matches_optional_bool(listing.has_balcony, has_balcony):
        return False
    if not _matches_optional_bool(listing.has_terrace, has_terrace):
        return False
    if not _matches_optional_bool(listing.has_garden, has_garden):
        return False
    if not _matches_optional_bool(listing.has_elevator, has_elevator):
        return False
    if parking_type is not None and not _matches_text(listing.parking_type, parking_type):
        return False
    if heating_type is not None and not _matches_text(listing.heating_type, heating_type):
        return False
    return True


def _matches_optional_bool(value: bool | None, expected: bool | None) -> bool:
    if expected is None:
        return True
    return value is expected


def _matches_text(value: str | None, expected: str) -> bool:
    return value is not None and value.casefold() == expected.casefold()
