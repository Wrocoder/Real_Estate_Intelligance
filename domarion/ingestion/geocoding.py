import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class GeocodingResult:
    lat: float
    lon: float
    provider: str
    precision: str
    confidence_score: int


@dataclass(frozen=True)
class OfflineGeocodingPoint:
    address_key: str
    city_key: str
    district_key: str
    lat: float
    lon: float
    precision: str
    confidence_score: int


PROVIDER_NAME = "offline_wroclaw_v1"
WROCLAW_ADDRESS_POINTS = (
    OfflineGeocodingPoint(
        address_key="nowy-dwor",
        city_key="wroclaw",
        district_key="fabryczna",
        lat=51.1108,
        lon=16.9639,
        precision="neighborhood",
        confidence_score=72,
    ),
    OfflineGeocodingPoint(
        address_key="jagodno",
        city_key="wroclaw",
        district_key="krzyki",
        lat=51.0592,
        lon=17.0641,
        precision="neighborhood",
        confidence_score=72,
    ),
    OfflineGeocodingPoint(
        address_key="soltysowice",
        city_key="wroclaw",
        district_key="psie-pole",
        lat=51.1525,
        lon=17.0645,
        precision="neighborhood",
        confidence_score=70,
    ),
    OfflineGeocodingPoint(
        address_key="piastow-slaskich",
        city_key="medlow",
        district_key="dolnoslaskie",
        lat=51.007355,
        lon=17.048521,
        precision="street",
        confidence_score=76,
    ),
    OfflineGeocodingPoint(
        address_key="piastow-slaskich",
        city_key="medlow",
        district_key="medlow",
        lat=51.007355,
        lon=17.048521,
        precision="street",
        confidence_score=76,
    ),
    OfflineGeocodingPoint(
        address_key="wroclawska",
        city_key="kobierzyce",
        district_key="kobierzyce",
        lat=50.9716,
        lon=16.9348,
        precision="street",
        confidence_score=73,
    ),
    OfflineGeocodingPoint(
        address_key="radosna",
        city_key="wysoka",
        district_key="wysoka",
        lat=51.0337,
        lon=17.0264,
        precision="street",
        confidence_score=74,
    ),
    OfflineGeocodingPoint(
        address_key="radosna",
        city_key="kobierzyce",
        district_key="wysoka",
        lat=51.0337,
        lon=17.0264,
        precision="street",
        confidence_score=72,
    ),
    OfflineGeocodingPoint(
        address_key="czekoladowa",
        city_key="bielany-wroclawskie",
        district_key="bielany-wroclawskie",
        lat=51.0357,
        lon=16.9675,
        precision="street",
        confidence_score=74,
    ),
    OfflineGeocodingPoint(
        address_key="czekoladowa",
        city_key="kobierzyce",
        district_key="bielany-wroclawskie",
        lat=51.0357,
        lon=16.9675,
        precision="street",
        confidence_score=72,
    ),
    OfflineGeocodingPoint(
        address_key="rynek",
        city_key="olawa",
        district_key="olawa",
        lat=50.9464,
        lon=17.2938,
        precision="street",
        confidence_score=73,
    ),
)
WROCLAW_DISTRICT_CENTROIDS = {
    ("wroclaw", "fabryczna"): GeocodingResult(
        lat=51.1076,
        lon=16.9279,
        provider=PROVIDER_NAME,
        precision="district_centroid",
        confidence_score=45,
    ),
    ("wroclaw", "krzyki"): GeocodingResult(
        lat=51.0719,
        lon=17.0442,
        provider=PROVIDER_NAME,
        precision="district_centroid",
        confidence_score=45,
    ),
    ("wroclaw", "psie-pole"): GeocodingResult(
        lat=51.1462,
        lon=17.0901,
        provider=PROVIDER_NAME,
        precision="district_centroid",
        confidence_score=43,
    ),
    ("medlow", "dolnoslaskie"): GeocodingResult(
        lat=51.007355,
        lon=17.048521,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=50,
    ),
    ("medlow", "medlow"): GeocodingResult(
        lat=51.007355,
        lon=17.048521,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=55,
    ),
    ("kobierzyce", "dolnoslaskie"): GeocodingResult(
        lat=50.9708,
        lon=16.9366,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=49,
    ),
    ("kobierzyce", "kobierzyce"): GeocodingResult(
        lat=50.9708,
        lon=16.9366,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=55,
    ),
    ("wysoka", "dolnoslaskie"): GeocodingResult(
        lat=51.0344,
        lon=17.0278,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=49,
    ),
    ("wysoka", "wysoka"): GeocodingResult(
        lat=51.0344,
        lon=17.0278,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=55,
    ),
    ("kobierzyce", "wysoka"): GeocodingResult(
        lat=51.0344,
        lon=17.0278,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=52,
    ),
    ("bielany-wroclawskie", "dolnoslaskie"): GeocodingResult(
        lat=51.0346,
        lon=16.966,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=49,
    ),
    ("bielany-wroclawskie", "bielany-wroclawskie"): GeocodingResult(
        lat=51.0346,
        lon=16.966,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=55,
    ),
    ("kobierzyce", "bielany-wroclawskie"): GeocodingResult(
        lat=51.0346,
        lon=16.966,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=52,
    ),
    ("olawa", "dolnoslaskie"): GeocodingResult(
        lat=50.946,
        lon=17.2926,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=49,
    ),
    ("olawa", "olawski"): GeocodingResult(
        lat=50.946,
        lon=17.2926,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=49,
    ),
    ("olawa", "olawa"): GeocodingResult(
        lat=50.946,
        lon=17.2926,
        provider=PROVIDER_NAME,
        precision="locality_centroid",
        confidence_score=55,
    ),
}


def geocode_partner_address(
    address: str,
    city: str,
    district: str,
) -> GeocodingResult | None:
    address_key = _normalize_key(address)
    city_key = _normalize_key(city)
    district_key = _normalize_key(district)

    for point in WROCLAW_ADDRESS_POINTS:
        if (
            point.city_key == city_key
            and point.district_key == district_key
            and point.address_key in address_key
        ):
            return GeocodingResult(
                lat=point.lat,
                lon=point.lon,
                provider=PROVIDER_NAME,
                precision=point.precision,
                confidence_score=point.confidence_score,
            )

    return WROCLAW_DISTRICT_CENTROIDS.get((city_key, district_key))


def _normalize_key(value: str) -> str:
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
    normalized = unicodedata.normalize("NFKD", normalized).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-")
    return normalized.lower()
