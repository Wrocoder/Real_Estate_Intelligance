import html
import json
import re
import unicodedata
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import UTC, date, datetime
from hashlib import sha256
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from pydantic import ValidationError

from domarion.ingestion.geocoding import GeocodingResult, geocode_partner_address
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaStatistics,
    Listing,
    SourceReferencePreview,
    SourceReferencePreviewRequest,
    SourceUrlImportFields,
    SourceUrlImportRequest,
    SourceUrlImportResult,
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
URL_IMPORT_USER_AGENT = "DomarionAnalytics/0.1 (+https://domarion.local)"
MAX_URL_IMPORT_BYTES = 1_500_000

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


@dataclass(frozen=True)
class SourceFetchResult:
    body: str
    final_url: str
    status_code: int
    content_type: str | None = None


class SourceUrlImportError(RuntimeError):
    pass


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


def import_listing_from_source_url(
    payload: SourceUrlImportRequest,
    fetcher: Callable[[str, float], SourceFetchResult] | None = None,
) -> SourceUrlImportResult:
    preview = build_source_reference_preview(
        SourceReferencePreviewRequest(source_url=payload.source_url)
    )
    if preview.provider == "other":
        return SourceUrlImportResult(
            reference_preview=preview,
            status="unsupported",
            fields=SourceUrlImportFields(),
            warnings=[
                *preview.warnings,
                "Automatic import currently supports only Otodom and OLX URLs.",
            ],
        )

    fetch = fetcher or _fetch_source_url_html
    try:
        fetched = fetch(preview.source_url_private, payload.timeout_seconds)
    except SourceUrlImportError as exc:
        return SourceUrlImportResult(
            reference_preview=preview,
            status="failed",
            fields=SourceUrlImportFields(),
            warnings=[
                *preview.warnings,
                str(exc),
                "Use manual fields if the portal blocks one-off import.",
            ],
        )

    fields = _extract_import_fields(fetched.body)
    extracted = _fields_extracted(fields)
    missing_required = [
        field for field in MANUAL_FIELDS_REQUIRED if getattr(fields, field) is None
    ]
    warnings = [
        "Fetched a single user-submitted URL without bulk crawling or anti-bot bypass.",
        "Photos, contacts and full description are not retained.",
        "Confirm extracted fields before generating a report.",
    ]
    if missing_required:
        warnings.append(f"Missing required fields: {', '.join(missing_required)}.")

    if not extracted:
        status = "failed"
    elif missing_required:
        status = "partial"
    else:
        status = "extracted"

    return SourceUrlImportResult(
        reference_preview=preview,
        status=status,
        fields=fields,
        fields_extracted=extracted,
        extraction_source="html_jsonld_meta_text",
        fetched_at=datetime.now(UTC),
        fetch_status_code=fetched.status_code,
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


def _fetch_source_url_html(source_url: str, timeout_seconds: float) -> SourceFetchResult:
    request = Request(
        source_url,
        headers={
            "User-Agent": URL_IMPORT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
        },
        method="GET",
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            body = response.read(MAX_URL_IMPORT_BYTES + 1)
            if len(body) > MAX_URL_IMPORT_BYTES:
                raise SourceUrlImportError("Imported page is too large for one-off URL import.")
            content_type = response.headers.get("Content-Type")
            charset = response.headers.get_content_charset() or "utf-8"
            return SourceFetchResult(
                body=body.decode(charset, errors="replace"),
                final_url=response.geturl(),
                status_code=getattr(response, "status", 200),
                content_type=content_type,
            )
    except HTTPError as exc:
        raise SourceUrlImportError(f"Portal returned HTTP {exc.code}.") from exc
    except (OSError, URLError) as exc:
        raise SourceUrlImportError(f"Could not fetch portal page: {exc}.") from exc


def _extract_import_fields(page_html: str) -> SourceUrlImportFields:
    fields = SourceUrlImportFields()
    for document in _json_documents(page_html):
        fields = _merge_import_fields(fields, _fields_from_json_value(document))
    fields = _merge_import_fields(fields, _fields_from_meta(page_html))
    fields = _merge_import_fields(fields, _fields_from_text(page_html))
    return fields


def _json_documents(page_html: str) -> Iterator[object]:
    stripped = page_html.strip()
    if stripped.startswith(("{", "[")):
        try:
            yield json.loads(stripped)
        except json.JSONDecodeError:
            pass

    for match in re.finditer(
        r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        page_html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        try:
            yield json.loads(html.unescape(match.group(1)).strip())
        except json.JSONDecodeError:
            continue

    for match in re.finditer(
        r"<script[^>]+id=[\"']__(?:NEXT_DATA|NUXT_DATA)__[\"'][^>]*>(.*?)</script>",
        page_html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        try:
            yield json.loads(html.unescape(match.group(1)).strip())
        except json.JSONDecodeError:
            continue


def _fields_from_json_value(value: object) -> SourceUrlImportFields:
    fields = SourceUrlImportFields()
    for item in _walk_json(value):
        if not isinstance(item, dict):
            continue
        fields = _merge_import_fields(fields, _fields_from_json_object(item))
    return fields


def _fields_from_json_object(item: dict) -> SourceUrlImportFields:
    fields = SourceUrlImportFields()
    lowered = {_json_key(key): value for key, value in item.items()}

    title = _first_text(lowered, ("name", "title", "headline"))
    if title:
        fields.title = title

    price = _first_number(lowered, ("price", "priceamount", "amount", "totalprice"))
    if price:
        fields.price = int(round(price))

    floor_size = lowered.get("floorsize")
    if isinstance(floor_size, dict):
        fields.area_m2 = _coerce_float(floor_size.get("value"))
    area = _first_number(
        lowered,
        ("area", "aream2", "areainsquaremeters", "usablearea", "floorarea"),
    )
    if area and fields.area_m2 is None:
        fields.area_m2 = area

    rooms = _first_number(lowered, ("rooms", "numberofrooms", "roomsnumber", "roomnumber"))
    if rooms:
        fields.rooms = int(round(rooms))

    floor = _first_number(lowered, ("floor", "floornumber"))
    if floor is not None:
        fields.floor = int(round(floor))

    building_floors = _first_number(
        lowered,
        ("buildingfloors", "totalfloors", "floorcount", "numberoffloors"),
    )
    if building_floors:
        fields.building_floors = int(round(building_floors))

    building_year = _first_number(
        lowered,
        ("buildingyear", "buildyear", "constructionyear", "yearbuilt"),
    )
    if building_year:
        fields.building_year = int(round(building_year))

    market_type = _market_type_from_value(
        _first_text(lowered, ("market", "markettype", "buildingmarket"))
    )
    if market_type:
        fields.market_type = market_type

    address = lowered.get("address")
    if isinstance(address, dict):
        address_lowered = {_json_key(key): value for key, value in address.items()}
        fields.address = _first_text(address_lowered, ("streetaddress", "address"))
        fields.city = _first_text(address_lowered, ("addresslocality", "locality", "city"))
        fields.district = _first_text(
            address_lowered,
            ("district", "neighborhood", "addressregion"),
        )
    else:
        fields.address = _first_text(lowered, ("streetaddress", "address", "location"))
        fields.city = _first_text(lowered, ("city", "locality", "addresslocality"))
        fields.district = _first_text(lowered, ("district", "neighborhood", "addressregion"))

    return fields


def _fields_from_meta(page_html: str) -> SourceUrlImportFields:
    fields = SourceUrlImportFields()
    title_match = re.search(
        r"<meta[^>]+(?:property|name)=[\"'](?:og:title|twitter:title|title)[\"'][^>]+content=[\"']([^\"']+)",
        page_html,
        flags=re.IGNORECASE,
    )
    if title_match:
        fields.title = html.unescape(title_match.group(1)).strip()
    return fields


def _fields_from_text(page_html: str) -> SourceUrlImportFields:
    text = _visible_text(page_html)
    fields = SourceUrlImportFields()
    price = _money_from_text(text)
    if price:
        fields.price = price

    area_match = re.search(r"(\d+(?:[,.]\d+)?)\s*(?:m²|m2|m kw\.?|mkw)", text, re.IGNORECASE)
    if area_match:
        fields.area_m2 = _coerce_float(area_match.group(1))

    rooms_match = re.search(r"(\d+)\s*(?:pokoi|pokoje|pokój|rooms?)", text, re.IGNORECASE)
    if rooms_match:
        fields.rooms = int(rooms_match.group(1))

    floor_match = re.search(r"(?:piętro|floor)\D{0,12}(\d+)", text, re.IGNORECASE)
    if floor_match:
        fields.floor = int(floor_match.group(1))

    year_match = re.search(
        r"(?:rok budowy|building year|year built)\D{0,20}((?:19|20)\d{2})",
        text,
        re.IGNORECASE,
    )
    if year_match:
        fields.building_year = int(year_match.group(1))

    return fields


def _walk_json(value: object) -> Iterator[object]:
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from _walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_json(child)


def _merge_import_fields(
    base: SourceUrlImportFields,
    update: SourceUrlImportFields,
) -> SourceUrlImportFields:
    data = base.model_dump()
    for key, value in update.model_dump().items():
        if data.get(key) is None and value is not None:
            data[key] = value
    return _validated_import_fields(data)


def _fields_extracted(fields: SourceUrlImportFields) -> list[str]:
    return [
        key
        for key, value in fields.model_dump().items()
        if value is not None
    ]


def _first_text(values: dict[str, object], keys: tuple[str, ...]) -> str | None:
    for key in keys:
        text = _coerce_text(values.get(key))
        if text:
            return text
    return None


def _first_number(values: dict[str, object], keys: tuple[str, ...]) -> float | None:
    for key in keys:
        number = _coerce_float(values.get(key))
        if number is not None:
            return number
    return None


def _coerce_text(value: object) -> str | None:
    if isinstance(value, str):
        cleaned = re.sub(r"\s+", " ", value).strip()
        return cleaned or None
    return None


def _coerce_float(value: object) -> float | None:
    if isinstance(value, int | float):
        return float(value)
    if not isinstance(value, str):
        return None
    normalized = value.replace("\xa0", " ").replace(" ", "").replace(",", ".")
    match = re.search(r"\d+(?:\.\d+)?", normalized)
    if not match:
        return None
    return float(match.group(0))


def _market_type_from_value(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.casefold()
    if "pierw" in normalized or "primary" in normalized:
        return "primary"
    if "wtór" in normalized or "wtor" in normalized or "secondary" in normalized:
        return "secondary"
    return None


def _visible_text(page_html: str) -> str:
    without_scripts = re.sub(
        r"<(script|style)[^>]*>.*?</\1>",
        " ",
        page_html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    text = re.sub(r"<[^>]+>", " ", without_scripts)
    return re.sub(r"\s+", " ", html.unescape(text))


def _money_from_text(text: str) -> int | None:
    candidates = []
    for match in re.finditer(r"(\d[\d\s\xa0.,]{2,})\s*(?:zł|PLN)", text, re.IGNORECASE):
        normalized = re.sub(r"[^\d]", "", match.group(1))
        if normalized:
            candidates.append(int(normalized))
    if not candidates:
        return None
    return max(candidates)


def _json_key(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value).casefold())


def _validated_import_fields(data: dict[str, object]) -> SourceUrlImportFields:
    clean: dict[str, object] = {}
    for key, value in data.items():
        if value is None:
            clean[key] = None
            continue
        try:
            SourceUrlImportFields(**{key: value})
        except ValidationError:
            clean[key] = None
        else:
            clean[key] = value
    return SourceUrlImportFields(**clean)


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
