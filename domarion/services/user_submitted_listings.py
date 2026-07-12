import re
import unicodedata
from datetime import date
from hashlib import sha256
from urllib.parse import urlparse

from domarion.ingestion.geocoding import GeocodingResult, geocode_partner_address
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaStatistics,
    Listing,
    SourceReferencePreview,
    SourceReferencePreviewRequest,
    UserSubmittedListingAnalysis,
    UserSubmittedListingRequest,
)
from domarion.services.scoring import build_listing_analysis, clamp

PRIVATE_SOURCE_URL_PLACEHOLDER = "private:user-submitted-reference"
COMPARABLES_BASIS = (
    "legal-first listings, partner snapshots, area statistics and open-data layers"
)
RETENTION_NOTE = (
    "User-submitted analysis is computed as a private draft; source URL is not exposed "
    "in public UI, SEO pages or generated listing analysis."
)

DISTRICT_DEFAULTS = {
    "wroclaw-fabryczna": {
        "distance_to_center_km": 6.6,
        "nearest_stop_m": 420,
        "nearest_school_m": 650,
        "nearest_major_road_m": 520,
        "nearest_industrial_zone_m": 1800,
        "parks_within_1km": 1,
        "schools_within_1km": 1,
    },
    "wroclaw-krzyki": {
        "distance_to_center_km": 5.8,
        "nearest_stop_m": 520,
        "nearest_school_m": 820,
        "nearest_major_road_m": 380,
        "nearest_industrial_zone_m": 2600,
        "parks_within_1km": 1,
        "schools_within_1km": 1,
    },
    "wroclaw-psie-pole": {
        "distance_to_center_km": 7.1,
        "nearest_stop_m": 470,
        "nearest_school_m": 610,
        "nearest_major_road_m": 760,
        "nearest_industrial_zone_m": 1500,
        "parks_within_1km": 2,
        "schools_within_1km": 1,
    },
}

MANUAL_FIELDS_REQUIRED = ["address", "district", "price", "area_m2", "rooms"]
MANUAL_FIELDS_RECOMMENDED = ["floor", "building_floors", "building_year", "market_type"]


def analyze_user_submitted_listing(
    repository: RealEstateRepository,
    payload: UserSubmittedListingRequest,
) -> UserSubmittedListingAnalysis:
    payload = _clean_payload(payload)
    if not payload.confirm_private_analysis:
        raise ValueError("Private analysis confirmation is required")

    area_statistics = _resolve_area_statistics(repository, payload.city, payload.district)
    if area_statistics is None:
        raise ValueError(
            "Area statistics are not available for this city/district in the current MVP data"
        )

    geocoding = _resolve_location(payload)
    source_domain = _source_domain(payload.source_url)
    warnings = _base_warnings(payload.source_url)
    if geocoding and payload.lat is None and payload.lon is None:
        warnings.append(
            "Location was approximated by offline geocoding; verify exact address before a deal."
        )

    defaulted_infrastructure = _has_missing_infrastructure(payload)
    if defaulted_infrastructure:
        warnings.append(
            "Some infrastructure fields were not provided; district-level defaults were used."
        )

    data_quality_score = _calculate_data_quality_score(
        payload,
        geocoding=geocoding,
        defaulted_infrastructure=defaulted_infrastructure,
    )
    listing = _build_listing(
        repository,
        payload,
        area_statistics=area_statistics,
        data_quality_score=data_quality_score,
        geocoding=geocoding,
    )
    analysis = build_listing_analysis(repository, listing)

    if not analysis.comparables:
        warnings.append(
            "Comparable listings are sparse; fair price estimate falls back to area-level stats."
        )

    confidence_score = clamp(
        data_quality_score * 0.55
        + analysis.scores.fair_price_confidence_score * 0.35
        + min(len(analysis.comparables), 5) * 2
    )

    analysis = analysis.model_copy(
        update={
            "data_quality_notes": [
                *analysis.data_quality_notes,
                "User-submitted object was analyzed without live portal scraping.",
                "Source URL, if provided, is treated as a private reference only.",
            ]
        }
    )

    return UserSubmittedListingAnalysis(
        analysis=analysis,
        confidence_score=confidence_score,
        source_url_private=payload.source_url,
        source_domain=source_domain,
        warnings=warnings,
        comparables_basis=COMPARABLES_BASIS,
        retention_note=RETENTION_NOTE,
    )


def build_source_reference_preview(
    payload: SourceReferencePreviewRequest,
) -> SourceReferencePreview:
    source_url = _clean_optional(payload.source_url)
    if source_url is None:
        raise ValueError("Source URL is required")

    normalized_url = _normalize_source_url(source_url)
    parsed = urlparse(normalized_url)
    source_domain = _source_domain(normalized_url)
    provider, provider_label = _source_provider(source_domain)
    source_slug = _source_slug(parsed.path)
    listing_reference_id = _listing_reference_id(source_slug)
    warnings = [
        "No portal page was fetched; only the URL string was parsed.",
        "Confirm price, area, rooms and address manually before generating a report.",
    ]
    if provider == "other":
        warnings.append(
            "Provider is not recognized as Otodom or OLX; analysis still works manually."
        )

    return SourceReferencePreview(
        source_url_private=normalized_url,
        source_domain=source_domain,
        provider=provider,
        provider_label=provider_label,
        listing_reference_id=listing_reference_id,
        source_slug=source_slug,
        suggested_title=_suggested_title(source_slug),
        manual_fields_required=MANUAL_FIELDS_REQUIRED,
        manual_fields_recommended=MANUAL_FIELDS_RECOMMENDED,
        privacy_note=RETENTION_NOTE,
        warnings=warnings,
    )


def _clean_payload(payload: UserSubmittedListingRequest) -> UserSubmittedListingRequest:
    title = _clean_optional(payload.title)
    source_url = _clean_optional(payload.source_url)
    address = payload.address.strip()
    city = payload.city.strip()
    district = payload.district.strip()
    if not address:
        raise ValueError("Address is required")
    if not city:
        raise ValueError("City is required")
    if not district:
        raise ValueError("District is required")
    if (payload.lat is None) != (payload.lon is None):
        raise ValueError("lat and lon must be provided together")
    return payload.model_copy(
        update={
            "title": title,
            "source_url": source_url,
            "address": address,
            "city": city,
            "district": district,
        }
    )


def _resolve_area_statistics(
    repository: RealEstateRepository,
    city: str,
    district: str,
) -> AreaStatistics | None:
    area_id = _area_id(city, district)
    stats = repository.get_area_statistics(area_id)
    if stats is not None:
        return stats

    city_key = city.casefold()
    district_key = district.casefold()
    for item in repository.list_area_statistics():
        if item.city.casefold() == city_key and item.name.casefold() == district_key:
            return item
    return None


def _resolve_location(payload: UserSubmittedListingRequest) -> GeocodingResult | None:
    if payload.lat is not None and payload.lon is not None:
        return None
    geocoding = geocode_partner_address(payload.address, payload.city, payload.district)
    if geocoding is None:
        raise ValueError("Could not geocode this address/district in the current MVP data")
    return geocoding


def _build_listing(
    repository: RealEstateRepository,
    payload: UserSubmittedListingRequest,
    area_statistics: AreaStatistics,
    data_quality_score: int,
    geocoding: GeocodingResult | None,
) -> Listing:
    area_id = area_statistics.area_id
    defaults = DISTRICT_DEFAULTS.get(area_id, {})
    planned_investments = repository.list_planned_investments(
        city=payload.city,
        district=payload.district,
    )
    today = date.today()
    listing_id = _listing_id(payload)
    price_per_m2 = round(payload.price / payload.area_m2)
    lat = payload.lat if payload.lat is not None else geocoding.lat if geocoding else 0
    lon = payload.lon if payload.lon is not None else geocoding.lon if geocoding else 0

    return Listing(
        id=listing_id,
        title=payload.title or f"Проверка: {payload.address}",
        source_name="User submitted private draft",
        source_url=PRIVATE_SOURCE_URL_PLACEHOLDER,
        city=payload.city,
        district=payload.district,
        area_id=area_id,
        municipality=payload.city,
        address=payload.address,
        market_type=payload.market_type,
        price=payload.price,
        area_m2=payload.area_m2,
        price_per_m2=price_per_m2,
        rooms=payload.rooms,
        floor=payload.floor,
        building_floors=payload.building_floors,
        building_year=payload.building_year,
        first_seen_at=today,
        last_seen_at=today,
        days_on_market=0,
        price_reductions=0,
        price_increases=0,
        relisted=False,
        lat=lat,
        lon=lon,
        distance_to_center_km=_float_value(
            payload.distance_to_center_km,
            defaults,
            "distance_to_center_km",
            7.0,
        ),
        nearest_stop_m=_int_value(payload.nearest_stop_m, defaults, "nearest_stop_m", 700),
        nearest_school_m=_int_value(payload.nearest_school_m, defaults, "nearest_school_m", 900),
        nearest_major_road_m=_int_value(
            payload.nearest_major_road_m,
            defaults,
            "nearest_major_road_m",
            600,
        ),
        nearest_industrial_zone_m=_int_value(
            payload.nearest_industrial_zone_m,
            defaults,
            "nearest_industrial_zone_m",
            2200,
        ),
        parks_within_1km=_int_value(payload.parks_within_1km, defaults, "parks_within_1km", 1),
        schools_within_1km=_int_value(
            payload.schools_within_1km,
            defaults,
            "schools_within_1km",
            1,
        ),
        planned_investments_within_2km=(
            payload.planned_investments_within_2km
            if payload.planned_investments_within_2km is not None
            else min(len(planned_investments), 5)
        ),
        data_quality_score=data_quality_score,
    )


def _calculate_data_quality_score(
    payload: UserSubmittedListingRequest,
    geocoding: GeocodingResult | None,
    defaulted_infrastructure: bool,
) -> int:
    score = 94
    if payload.floor is None:
        score -= 5
    if payload.building_floors is None:
        score -= 3
    if payload.building_year is None:
        score -= 7
    if geocoding:
        score -= 8 if geocoding.precision == "neighborhood" else 18
        score += max(0, geocoding.confidence_score - 50) * 0.08
    if defaulted_infrastructure:
        score -= 9
    if payload.source_url is None:
        score -= 2
    return clamp(score, minimum=35, maximum=95)


def _has_missing_infrastructure(payload: UserSubmittedListingRequest) -> bool:
    return any(
        value is None
        for value in (
            payload.distance_to_center_km,
            payload.nearest_stop_m,
            payload.nearest_school_m,
            payload.nearest_major_road_m,
            payload.nearest_industrial_zone_m,
            payload.parks_within_1km,
            payload.schools_within_1km,
            payload.planned_investments_within_2km,
        )
    )


def _base_warnings(source_url: str | None) -> list[str]:
    warnings = ["No live portal data was fetched; analysis uses user input and legal-first data."]
    if source_url:
        warnings.append(
            "Source URL is kept as a private reference and not exposed in public listing analysis."
        )
    return warnings


def _listing_id(payload: UserSubmittedListingRequest) -> str:
    body = "|".join(
        [
            payload.city.casefold(),
            payload.district.casefold(),
            payload.address.casefold(),
            str(payload.price),
            str(payload.area_m2),
            str(payload.rooms),
        ]
    )
    return f"user-submitted-{sha256(body.encode('utf-8')).hexdigest()[:12]}"


def _area_id(city: str, district: str) -> str:
    return f"{_slug(city)}-{_slug(district)}"


def _slug(value: str) -> str:
    normalized = value.translate(
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
    ascii_value = (
        unicodedata.normalize("NFKD", normalized).encode("ascii", "ignore").decode("ascii")
    )
    return re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()


def _source_domain(source_url: str | None) -> str | None:
    if not source_url:
        return None
    parsed = urlparse(source_url)
    if not parsed.netloc:
        parsed = urlparse(f"https://{source_url}")
    domain = parsed.netloc.casefold()
    return domain.removeprefix("www.") or None


def _normalize_source_url(source_url: str) -> str:
    value = source_url.strip()
    parsed = urlparse(value)
    if parsed.scheme:
        return value
    return f"https://{value}"


def _source_provider(source_domain: str | None) -> tuple[str, str]:
    if source_domain is None:
        return "other", "Manual URL"
    if source_domain == "otodom.pl" or source_domain.endswith(".otodom.pl"):
        return "otodom", "Otodom"
    if source_domain == "olx.pl" or source_domain.endswith(".olx.pl"):
        return "olx", "OLX"
    return "other", source_domain


def _source_slug(path: str) -> str | None:
    segments = [segment for segment in path.split("/") if segment]
    if not segments:
        return None
    for segment in reversed(segments):
        if segment.casefold() not in {"pl", "oferta", "d"}:
            return segment.removesuffix(".html")
    return segments[-1].removesuffix(".html")


def _listing_reference_id(source_slug: str | None) -> str | None:
    if source_slug is None:
        return None
    candidates = re.findall(r"(ID[a-zA-Z0-9]+|[A-Z0-9]{8,})", source_slug)
    if candidates:
        return candidates[-1]
    return source_slug[:120]


def _suggested_title(source_slug: str | None) -> str | None:
    if source_slug is None:
        return None
    without_id = re.sub(r"[-_]?ID[a-zA-Z0-9]+$", "", source_slug)
    words = re.split(r"[-_]+", without_id)
    useful_words = [
        word
        for word in words
        if word and not re.fullmatch(r"[A-Z0-9]{8,}", word)
    ]
    if not useful_words:
        return None
    return " ".join(useful_words[:10]).capitalize()


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _int_value(
    value: int | None,
    defaults: dict[str, float | int],
    key: str,
    fallback: int,
) -> int:
    return int(value if value is not None else defaults.get(key, fallback))


def _float_value(
    value: float | None,
    defaults: dict[str, float | int],
    key: str,
    fallback: float,
) -> float:
    return float(value if value is not None else defaults.get(key, fallback))
