import csv
import re
import unicodedata
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from domarion.ingestion.geocoding import GeocodingResult, geocode_partner_address
from domarion.schemas import Listing

REQUIRED_COLUMNS = {
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
}


class PartnerCsvError(ValueError):
    pass


@dataclass(frozen=True)
class PartnerListingRecord:
    source_name: str
    source_type: str
    source_base_url: str | None
    source_listing_id: str
    source_url: str
    observed_at: date
    raw_payload: dict[str, str]
    listing: Listing


def read_partner_csv(
    path: str | Path,
    default_source_name: str,
    default_source_type: str = "partner_csv",
) -> list[PartnerListingRecord]:
    csv_path = Path(path)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames is None:
            raise PartnerCsvError("CSV file has no header row.")

        missing_columns = REQUIRED_COLUMNS - set(reader.fieldnames)
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise PartnerCsvError(f"CSV is missing required columns: {missing}.")

        records = []
        for row_number, row in enumerate(reader, start=2):
            try:
                records.append(
                    normalize_partner_row(
                        row,
                        row_number=row_number,
                        default_source_name=default_source_name,
                        default_source_type=default_source_type,
                    )
                )
            except PartnerCsvError:
                raise
            except Exception as exc:
                raise PartnerCsvError(f"Row {row_number}: {exc}") from exc

    return records


def normalize_partner_row(
    row: dict[str, str | None],
    row_number: int,
    default_source_name: str,
    default_source_type: str = "partner_csv",
) -> PartnerListingRecord:
    source_listing_id = _required_str(row, "source_listing_id", row_number)
    source_url = _required_str(row, "source_url", row_number)
    city = _required_str(row, "city", row_number)
    district = _required_str(row, "district", row_number)
    address = _required_str(row, "address", row_number)
    area_m2 = _required_float(row, "area_m2", row_number)
    price = _required_int(row, "price", row_number)
    rooms = _required_int(row, "rooms", row_number)
    first_seen_at = _optional_date(row, "first_seen_at") or _optional_date(row, "observed_at")
    last_seen_at = _optional_date(row, "last_seen_at") or _optional_date(row, "observed_at")
    observed_at = _optional_date(row, "observed_at") or last_seen_at or date.today()

    if first_seen_at is None:
        first_seen_at = observed_at
    if last_seen_at is None:
        last_seen_at = observed_at

    market_type = _required_str(row, "market_type", row_number).lower()
    if market_type not in {"primary", "secondary"}:
        raise PartnerCsvError(
            f"Row {row_number}: market_type must be 'primary' or 'secondary'."
        )

    area_id = _optional_str(row, "area_id") or slugify(f"{city}-{district}")
    data_quality_score = _optional_int(row, "data_quality_score")
    if data_quality_score is None:
        data_quality_score = _estimate_data_quality(row)

    lat, lon, geocoding_result = _coordinates_from_row(
        row,
        row_number=row_number,
        address=address,
        city=city,
        district=district,
    )
    if geocoding_result is not None:
        data_quality_score = min(data_quality_score, geocoding_result.confidence_score)

    listing = Listing(
        id=source_listing_id,
        title=_required_str(row, "title", row_number),
        source_name=_optional_str(row, "source_name") or default_source_name,
        source_url=source_url,
        voivodeship=_optional_str(row, "voivodeship"),
        city=city,
        district=district,
        area_id=area_id,
        municipality=_optional_str(row, "municipality") or city,
        address=address,
        market_type=market_type,
        building_type=_optional_str(row, "building_type"),
        renovation_state=_optional_str(row, "renovation_state"),
        has_balcony=_optional_bool_or_none(row, "has_balcony"),
        has_terrace=_optional_bool_or_none(row, "has_terrace"),
        has_garden=_optional_bool_or_none(row, "has_garden"),
        has_elevator=_optional_bool_or_none(row, "has_elevator"),
        parking_type=_optional_str(row, "parking_type"),
        heating_type=_optional_str(row, "heating_type"),
        price=price,
        currency=_optional_str(row, "currency") or "PLN",
        area_m2=area_m2,
        price_per_m2=_optional_int(row, "price_per_m2") or int(round(price / area_m2)),
        rooms=rooms,
        floor=_optional_int(row, "floor"),
        building_floors=_optional_int(row, "building_floors"),
        building_year=_optional_int(row, "building_year"),
        first_seen_at=first_seen_at,
        last_seen_at=last_seen_at,
        days_on_market=_optional_int(row, "days_on_market")
        or max((last_seen_at - first_seen_at).days, 0),
        price_reductions=_optional_int(row, "price_reductions") or 0,
        price_increases=_optional_int(row, "price_increases") or 0,
        relisted=_optional_bool(row, "relisted"),
        lat=lat,
        lon=lon,
        distance_to_center_km=_optional_float(row, "distance_to_center_km") or 0.0,
        nearest_stop_m=_optional_int(row, "nearest_stop_m") or 9999,
        nearest_school_m=_optional_int(row, "nearest_school_m") or 9999,
        nearest_major_road_m=_optional_int(row, "nearest_major_road_m") or 9999,
        nearest_industrial_zone_m=_optional_int(row, "nearest_industrial_zone_m") or 9999,
        parks_within_1km=_optional_int(row, "parks_within_1km") or 0,
        schools_within_1km=_optional_int(row, "schools_within_1km") or 0,
        planned_investments_within_2km=_optional_int(row, "planned_investments_within_2km") or 0,
        data_quality_score=max(0, min(100, data_quality_score)),
    )

    return PartnerListingRecord(
        source_name=listing.source_name,
        source_type=_optional_str(row, "source_type") or default_source_type,
        source_base_url=_optional_str(row, "source_base_url"),
        source_listing_id=source_listing_id,
        source_url=source_url,
        observed_at=observed_at,
        raw_payload=_raw_payload_with_geocoding(row, geocoding_result),
        listing=listing,
    )


def slugify(value: str) -> str:
    value = value.translate(
        str.maketrans(
            {
                "ą": "a",
                "ć": "c",
                "ę": "e",
                "ł": "l",
                "ń": "n",
                "ó": "o",
                "ś": "s",
                "ź": "z",
                "ż": "z",
                "Ą": "A",
                "Ć": "C",
                "Ę": "E",
                "Ł": "L",
                "Ń": "N",
                "Ó": "O",
                "Ś": "S",
                "Ź": "Z",
                "Ż": "Z",
            }
        )
    )
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-")
    return normalized.lower()


def _estimate_data_quality(row: dict[str, str | None]) -> int:
    score = 95
    if not _optional_str(row, "lat") or not _optional_str(row, "lon"):
        score -= 10
    for key in ("floor", "building_floors", "building_year"):
        if not _optional_str(row, key):
            score -= 5
    for key in (
        "nearest_stop_m",
        "nearest_school_m",
        "nearest_major_road_m",
        "nearest_industrial_zone_m",
    ):
        if not _optional_str(row, key):
            score -= 7
    if not _optional_str(row, "distance_to_center_km"):
        score -= 5
    return max(score, 35)


def _coordinates_from_row(
    row: dict[str, str | None],
    row_number: int,
    address: str,
    city: str,
    district: str,
) -> tuple[float, float, GeocodingResult | None]:
    lat = _optional_float(row, "lat")
    lon = _optional_float(row, "lon")
    if lat is not None and lon is not None:
        return lat, lon, None

    result = geocode_partner_address(address=address, city=city, district=district)
    if result is None:
        raise PartnerCsvError(
            f"Row {row_number}: columns 'lat' and 'lon' are required "
            "when offline geocoding cannot resolve the address."
        )
    return result.lat, result.lon, result


def _raw_payload_with_geocoding(
    row: dict[str, str | None],
    geocoding_result: GeocodingResult | None,
) -> dict[str, str]:
    payload = {key: value or "" for key, value in row.items()}
    if geocoding_result is not None:
        payload.update(
            {
                "geocoded_lat": str(geocoding_result.lat),
                "geocoded_lon": str(geocoding_result.lon),
                "geocoding_provider": geocoding_result.provider,
                "geocoding_precision": geocoding_result.precision,
                "geocoding_confidence_score": str(geocoding_result.confidence_score),
            }
        )
    return payload


def _required_str(row: dict[str, str | None], key: str, row_number: int) -> str:
    value = _optional_str(row, key)
    if value is None:
        raise PartnerCsvError(f"Row {row_number}: column '{key}' is required.")
    return value


def _required_int(row: dict[str, str | None], key: str, row_number: int) -> int:
    value = _optional_int(row, key)
    if value is None:
        raise PartnerCsvError(f"Row {row_number}: column '{key}' must be an integer.")
    return value


def _required_float(row: dict[str, str | None], key: str, row_number: int) -> float:
    value = _optional_float(row, key)
    if value is None:
        raise PartnerCsvError(f"Row {row_number}: column '{key}' must be a number.")
    return value


def _optional_str(row: dict[str, str | None], key: str) -> str | None:
    value = row.get(key)
    if value is None:
        return None
    value = value.strip()
    return value or None


def _optional_int(row: dict[str, str | None], key: str) -> int | None:
    value = _optional_str(row, key)
    if value is None:
        return None
    return int(value.replace(" ", ""))


def _optional_float(row: dict[str, str | None], key: str) -> float | None:
    value = _optional_str(row, key)
    if value is None:
        return None
    return float(value.replace(" ", "").replace(",", "."))


def _optional_date(row: dict[str, str | None], key: str) -> date | None:
    value = _optional_str(row, key)
    if value is None:
        return None
    return date.fromisoformat(value)


def _optional_bool(row: dict[str, str | None], key: str) -> bool:
    value = _optional_str(row, key)
    if value is None:
        return False
    return value.lower() in {"1", "true", "yes", "y", "tak", "t"}


def _optional_bool_or_none(row: dict[str, str | None], key: str) -> bool | None:
    value = _optional_str(row, key)
    if value is None:
        return None
    return value.lower() in {"1", "true", "yes", "y", "tak", "t"}
