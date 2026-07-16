import re
import unicodedata

from domarion.schemas import Listing


def listing_matches_query(listing: Listing, query: str | None) -> bool:
    tokens = normalize_search_tokens(query)
    if not tokens:
        return True

    haystack = _listing_search_blob(listing)
    return all(token in haystack for token in tokens)


def normalize_search_tokens(query: str | None) -> list[str]:
    if not query:
        return []
    normalized = _normalize_text(query)
    return [token for token in re.split(r"\s+", normalized) if len(token) >= 2]


def _listing_search_blob(listing: Listing) -> str:
    values = [
        listing.id,
        listing.title,
        listing.source_name,
        listing.source_url,
        listing.voivodeship or "",
        listing.city,
        listing.district,
        listing.area_id,
        listing.municipality,
        listing.address,
        listing.market_type,
        listing.building_type or "",
        listing.renovation_state or "",
        str(listing.rooms),
        str(listing.floor) if listing.floor is not None else "",
        str(listing.building_floors) if listing.building_floors is not None else "",
        str(listing.building_year) if listing.building_year is not None else "",
    ]
    return _normalize_text(" ".join(values))


def _normalize_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    lowered = without_accents.casefold()
    return re.sub(r"[^a-z0-9]+", " ", lowered).strip()
