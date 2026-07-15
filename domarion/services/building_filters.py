from domarion.schemas import Listing


def matches_building_filters(
    listing: Listing,
    *,
    min_floor: int | None = None,
    max_floor: int | None = None,
    max_building_floors: int | None = None,
    min_building_year: int | None = None,
    max_building_year: int | None = None,
) -> bool:
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
