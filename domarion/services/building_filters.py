from domarion.schemas import Listing


def matches_building_filters(
    listing: Listing,
    *,
    building_type: str | None = None,
    renovation_state: str | None = None,
    min_floor: int | None = None,
    max_floor: int | None = None,
    max_building_floors: int | None = None,
    min_building_year: int | None = None,
    max_building_year: int | None = None,
) -> bool:
    if building_type is not None and not _matches_text(listing.building_type, building_type):
        return False
    if renovation_state is not None and not _matches_text(
        listing.renovation_state,
        renovation_state,
    ):
        return False
    if min_floor is not None and (listing.floor is None or listing.floor < min_floor):
        return False
    if max_floor is not None and (listing.floor is None or listing.floor > max_floor):
        return False
    if max_building_floors is not None and (
        listing.building_floors is None or listing.building_floors > max_building_floors
    ):
        return False
    if min_building_year is not None and (
        listing.building_year is None or listing.building_year < min_building_year
    ):
        return False
    if max_building_year is not None and (
        listing.building_year is None or listing.building_year > max_building_year
    ):
        return False
    return True


def _matches_text(value: str | None, expected: str) -> bool:
    return value is not None and value.casefold() == expected.casefold()
