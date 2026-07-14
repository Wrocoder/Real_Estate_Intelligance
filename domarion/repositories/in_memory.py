import re
import unicodedata
from collections.abc import Iterable
from datetime import date
from math import asin, cos, radians, sin, sqrt
from uuid import uuid4

from domarion.repositories.base import BBox
from domarion.schemas import (
    AmenityReference,
    AreaStatistics,
    DistrictReference,
    IndustrialZoneReference,
    KindergartenReference,
    Listing,
    ListingEvent,
    LocationReference,
    LocationReferenceType,
    MunicipalityReference,
    PlannedInvestment,
    PlannedInvestmentCreate,
    PlannedInvestmentUpdate,
    PriceHistoryPoint,
    SchoolReference,
    TransportRouteReference,
    TransportStopReference,
)
from domarion.services.listing_events import ListingEventInput, derive_listing_events


class InMemoryRealEstateRepository:
    """Temporary repository for the first API slice before PostgreSQL/PostGIS wiring."""

    def __init__(self) -> None:
        self._areas = {
            "wroclaw-krzyki": AreaStatistics(
                area_id="wroclaw-krzyki",
                name="Krzyki",
                city="Wrocław",
                median_price_per_m2=13200,
                average_price_per_m2=13750,
                active_listings=842,
                new_listings_30d=118,
                removed_listings_30d=94,
                average_days_on_market=78,
                price_change_90d_pct=1.8,
                supply_change_90d_pct=5.6,
            ),
            "wroclaw-fabryczna": AreaStatistics(
                area_id="wroclaw-fabryczna",
                name="Fabryczna",
                city="Wrocław",
                median_price_per_m2=11800,
                average_price_per_m2=12150,
                active_listings=691,
                new_listings_30d=96,
                removed_listings_30d=88,
                average_days_on_market=84,
                price_change_90d_pct=0.9,
                supply_change_90d_pct=8.1,
            ),
            "wroclaw-psie-pole": AreaStatistics(
                area_id="wroclaw-psie-pole",
                name="Psie Pole",
                city="Wrocław",
                median_price_per_m2=11250,
                average_price_per_m2=11640,
                active_listings=514,
                new_listings_30d=71,
                removed_listings_30d=61,
                average_days_on_market=92,
                price_change_90d_pct=2.4,
                supply_change_90d_pct=3.2,
            ),
            "medlow-medlow": AreaStatistics(
                area_id="medlow-medlow",
                name="Mędłów",
                city="Mędłów",
                median_price_per_m2=10400,
                average_price_per_m2=10650,
                active_listings=46,
                new_listings_30d=7,
                removed_listings_30d=5,
                average_days_on_market=96,
                price_change_90d_pct=1.1,
                supply_change_90d_pct=6.4,
            ),
        }

        self._listings = {
            "wr-001": Listing(
                id="wr-001",
                title="3 pokoje przy planowanej trasie tramwajowej",
                source_name="Partner Agency Demo",
                source_url="https://example.com/listings/wr-001",
                city="Wrocław",
                district="Fabryczna",
                area_id="wroclaw-fabryczna",
                municipality="Wrocław",
                address="Nowy Dwór, Wrocław",
                market_type="secondary",
                price=690000,
                currency="PLN",
                area_m2=59.2,
                price_per_m2=11655,
                rooms=3,
                floor=3,
                building_floors=6,
                building_year=2012,
                first_seen_at=date(2026, 4, 12),
                last_seen_at=date(2026, 7, 8),
                days_on_market=87,
                price_reductions=2,
                price_increases=0,
                relisted=False,
                lat=51.1117,
                lon=16.9653,
                distance_to_center_km=6.8,
                nearest_stop_m=260,
                nearest_school_m=620,
                nearest_major_road_m=420,
                nearest_industrial_zone_m=1900,
                parks_within_1km=2,
                schools_within_1km=2,
                planned_investments_within_2km=3,
                data_quality_score=82,
            ),
            "wr-002": Listing(
                id="wr-002",
                title="Nowe 2 pokoje, wysoki standard, Krzyki",
                source_name="Developer Demo",
                source_url="https://example.com/listings/wr-002",
                city="Wrocław",
                district="Krzyki",
                area_id="wroclaw-krzyki",
                municipality="Wrocław",
                address="Jagodno, Wrocław",
                market_type="primary",
                price=742000,
                currency="PLN",
                area_m2=49.1,
                price_per_m2=15112,
                rooms=2,
                floor=5,
                building_floors=7,
                building_year=2026,
                first_seen_at=date(2026, 6, 3),
                last_seen_at=date(2026, 7, 8),
                days_on_market=35,
                price_reductions=0,
                price_increases=1,
                relisted=False,
                lat=51.0583,
                lon=17.0637,
                distance_to_center_km=6.2,
                nearest_stop_m=540,
                nearest_school_m=950,
                nearest_major_road_m=310,
                nearest_industrial_zone_m=2600,
                parks_within_1km=1,
                schools_within_1km=1,
                planned_investments_within_2km=2,
                data_quality_score=76,
            ),
            "wr-003": Listing(
                id="wr-003",
                title="Rodzinne 4 pokoje blisko zieleni",
                source_name="Partner Agency Demo",
                source_url="https://example.com/listings/wr-003",
                city="Wrocław",
                district="Psie Pole",
                area_id="wroclaw-psie-pole",
                municipality="Wrocław",
                address="Sołtysowice, Wrocław",
                market_type="secondary",
                price=799000,
                currency="PLN",
                area_m2=74.5,
                price_per_m2=10725,
                rooms=4,
                floor=1,
                building_floors=4,
                building_year=2007,
                first_seen_at=date(2026, 2, 20),
                last_seen_at=date(2026, 7, 8),
                days_on_market=139,
                price_reductions=3,
                price_increases=0,
                relisted=True,
                lat=51.1525,
                lon=17.0645,
                distance_to_center_km=7.4,
                nearest_stop_m=390,
                nearest_school_m=510,
                nearest_major_road_m=780,
                nearest_industrial_zone_m=1300,
                parks_within_1km=3,
                schools_within_1km=2,
                planned_investments_within_2km=1,
                data_quality_score=79,
            ),
            "med-001": Listing(
                id="med-001",
                title="3 pokoje, niska zabudowa, Mędłów",
                source_name="Partner Suburban Seed",
                source_url="https://example.com/listings/med-001",
                city="Mędłów",
                district="Mędłów",
                area_id="medlow-medlow",
                municipality="Mędłów",
                address="Piastów Śląskich, Mędłów",
                market_type="secondary",
                price=612000,
                currency="PLN",
                area_m2=60.1,
                price_per_m2=10183,
                rooms=3,
                floor=1,
                building_floors=2,
                building_year=2010,
                first_seen_at=date(2026, 4, 21),
                last_seen_at=date(2026, 7, 8),
                days_on_market=78,
                price_reductions=1,
                price_increases=0,
                relisted=False,
                lat=51.0071,
                lon=17.0476,
                distance_to_center_km=12.8,
                nearest_stop_m=520,
                nearest_school_m=1450,
                nearest_major_road_m=830,
                nearest_industrial_zone_m=3100,
                parks_within_1km=1,
                schools_within_1km=0,
                planned_investments_within_2km=0,
                data_quality_score=77,
            ),
            "med-002": Listing(
                id="med-002",
                title="Mieszkanie 3 pokoje z ogródkiem, Mędłów",
                source_name="Partner Suburban Seed",
                source_url="https://example.com/listings/med-002",
                city="Mędłów",
                district="Mędłów",
                area_id="medlow-medlow",
                municipality="Mędłów",
                address="Kwiatowa, Mędłów",
                market_type="secondary",
                price=639000,
                currency="PLN",
                area_m2=58.2,
                price_per_m2=10979,
                rooms=3,
                floor=0,
                building_floors=2,
                building_year=2013,
                first_seen_at=date(2026, 5, 9),
                last_seen_at=date(2026, 7, 8),
                days_on_market=61,
                price_reductions=0,
                price_increases=0,
                relisted=False,
                lat=51.0049,
                lon=17.0464,
                distance_to_center_km=13.0,
                nearest_stop_m=610,
                nearest_school_m=1510,
                nearest_major_road_m=760,
                nearest_industrial_zone_m=3300,
                parks_within_1km=1,
                schools_within_1km=0,
                planned_investments_within_2km=0,
                data_quality_score=74,
            ),
            "med-003": Listing(
                id="med-003",
                title="Dwupoziomowe 4 pokoje pod Wrocławiem",
                source_name="Partner Suburban Seed",
                source_url="https://example.com/listings/med-003",
                city="Mędłów",
                district="Mędłów",
                area_id="medlow-medlow",
                municipality="Mędłów",
                address="Sportowa, Mędłów",
                market_type="secondary",
                price=760000,
                currency="PLN",
                area_m2=72.5,
                price_per_m2=10483,
                rooms=4,
                floor=1,
                building_floors=2,
                building_year=2009,
                first_seen_at=date(2026, 3, 18),
                last_seen_at=date(2026, 7, 8),
                days_on_market=112,
                price_reductions=2,
                price_increases=0,
                relisted=False,
                lat=51.0083,
                lon=17.0512,
                distance_to_center_km=12.6,
                nearest_stop_m=700,
                nearest_school_m=1320,
                nearest_major_road_m=890,
                nearest_industrial_zone_m=2950,
                parks_within_1km=2,
                schools_within_1km=0,
                planned_investments_within_2km=0,
                data_quality_score=76,
            ),
        }

        self._planned_investments = {
            "pi-001": PlannedInvestment(
                id="pi-001",
                name="Demo: Nowy Dwór tram corridor",
                investment_type="tram",
                status="planned",
                city="Wrocław",
                district="Fabryczna",
                expected_year=2027,
                lat=51.1125,
                lon=16.9671,
                source_url="https://example.com/planned-investments/nowy-dwor-tram",
                confidence_score=72,
                notes="Demo layer for MVP validation; replace with verified municipal data.",
            ),
            "pi-002": PlannedInvestment(
                id="pi-002",
                name="Demo: Jagodno road and bus priority upgrade",
                investment_type="road_transport",
                status="in_consultation",
                city="Wrocław",
                district="Krzyki",
                expected_year=2028,
                lat=51.0574,
                lon=17.0619,
                source_url="https://example.com/planned-investments/jagodno-transport",
                confidence_score=66,
                notes="Demo layer for MVP validation; replace with verified municipal data.",
            ),
            "pi-003": PlannedInvestment(
                id="pi-003",
                name="Demo: Psie Pole school and public services hub",
                investment_type="school",
                status="planned",
                city="Wrocław",
                district="Psie Pole",
                expected_year=2029,
                lat=51.1538,
                lon=17.0649,
                source_url="https://example.com/planned-investments/psie-pole-school",
                confidence_score=61,
                notes="Demo layer for MVP validation; replace with verified municipal data.",
            ),
            "pi-004": PlannedInvestment(
                id="pi-004",
                name="Demo: pocket park and greenery renewal",
                investment_type="park",
                status="planned",
                city="Wrocław",
                district="Psie Pole",
                expected_year=2027,
                lat=51.1509,
                lon=17.0704,
                source_url="https://example.com/planned-investments/greenery-renewal",
                confidence_score=58,
                notes="Demo layer for MVP validation; replace with verified municipal data.",
            ),
        }

        self._transport_stops = [
            TransportStopReference(
                id="stop-wroclaw-nowy-dwor-pr",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Nowy Dwór P+R",
                stop_type="tram_bus",
                lat=51.1125,
                lon=16.9671,
                lines=["13", "23", "142"],
                source_url="https://example.com/open-data/transport-stops/nowy-dwor-pr",
                metadata={"source": "demo_seed", "status": "planned"},
            ),
            TransportStopReference(
                id="stop-wroclaw-jagodno-buforowa",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-krzyki",
                district_name="Krzyki",
                name="Jagodno Buforowa",
                stop_type="bus",
                lat=51.0574,
                lon=17.0619,
                lines=["110", "145"],
                source_url="https://example.com/open-data/transport-stops/jagodno-buforowa",
                metadata={"source": "demo_seed", "status": "active"},
            ),
        ]
        self._transport_routes = [
            TransportRouteReference(
                id="route-wroclaw-tram-13",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                route_number="13",
                route_name="Nowy Dwór - Centrum",
                route_type="tram",
                operator="MPK Wrocław",
                status="planned",
                stop_ids=["stop-wroclaw-nowy-dwor-pr"],
                metadata={"source": "demo_seed"},
            ),
            TransportRouteReference(
                id="route-wroclaw-bus-145",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-krzyki",
                district_name="Krzyki",
                route_number="145",
                route_name="Jagodno - Dworzec Główny",
                route_type="bus",
                operator="MPK Wrocław",
                status="active",
                stop_ids=["stop-wroclaw-jagodno-buforowa"],
                metadata={"source": "demo_seed"},
            ),
        ]
        self._schools = [
            SchoolReference(
                id="school-wroclaw-sp-fabryczna-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Primary School Fabryczna",
                school_type="primary",
                operator_type="public",
                lat=51.1141,
                lon=16.9608,
                source_url="https://example.com/open-data/schools/fabryczna-demo",
                metadata={"source": "demo_seed"},
            ),
            SchoolReference(
                id="school-wroclaw-sp-psie-pole-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-psie-pole",
                district_name="Psie Pole",
                name="Demo Primary School Psie Pole",
                school_type="primary",
                operator_type="public",
                lat=51.1535,
                lon=17.0621,
                source_url="https://example.com/open-data/schools/psie-pole-demo",
                metadata={"source": "demo_seed"},
            ),
        ]
        self._kindergartens = [
            KindergartenReference(
                id="kindergarten-wroclaw-nowy-dwor-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Kindergarten Nowy Dwór",
                kindergarten_type="preschool",
                operator_type="public",
                lat=51.1104,
                lon=16.9639,
                source_url="https://example.com/open-data/kindergartens/nowy-dwor-demo",
                metadata={"source": "demo_seed"},
            ),
            KindergartenReference(
                id="kindergarten-wroclaw-jagodno-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-krzyki",
                district_name="Krzyki",
                name="Demo Kindergarten Jagodno",
                kindergarten_type="preschool",
                operator_type="public",
                lat=51.0589,
                lon=17.0588,
                source_url="https://example.com/open-data/kindergartens/jagodno-demo",
                metadata={"source": "demo_seed"},
            ),
        ]
        self._amenities = [
            AmenityReference(
                id="amenity-wroclaw-nowy-dwor-park-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Pocket Park Nowy Dwór",
                amenity_type="park",
                lat=51.1096,
                lon=16.9691,
                source_url="https://example.com/open-data/amenities/nowy-dwor-park-demo",
                metadata={"source": "demo_seed"},
            ),
            AmenityReference(
                id="amenity-wroclaw-psie-pole-services-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-psie-pole",
                district_name="Psie Pole",
                name="Demo Public Services Hub Psie Pole",
                amenity_type="public_services",
                lat=51.1542,
                lon=17.0656,
                source_url="https://example.com/open-data/amenities/psie-pole-services-demo",
                metadata={"source": "demo_seed"},
            ),
        ]
        self._industrial_zones = [
            IndustrialZoneReference(
                id="industrial-zone-wroclaw-fabryczna-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Fabryczna Industrial Edge",
                zone_type="light_industrial",
                risk_level="moderate",
                impact_radius_m=1800,
                lat=51.1239,
                lon=16.9424,
                source_url="https://example.com/open-data/industrial-zones/fabryczna-demo",
                metadata={"source": "demo_seed"},
            )
        ]

        self._history = {
            "wr-001": [
                PriceHistoryPoint(observed_at=date(2026, 4, 12), price=725000, price_per_m2=12247),
                PriceHistoryPoint(observed_at=date(2026, 5, 18), price=705000, price_per_m2=11909),
                PriceHistoryPoint(observed_at=date(2026, 6, 29), price=690000, price_per_m2=11655),
            ],
            "wr-002": [
                PriceHistoryPoint(observed_at=date(2026, 6, 3), price=729000, price_per_m2=14847),
                PriceHistoryPoint(observed_at=date(2026, 6, 25), price=742000, price_per_m2=15112),
            ],
            "wr-003": [
                PriceHistoryPoint(observed_at=date(2026, 2, 20), price=849000, price_per_m2=11396),
                PriceHistoryPoint(observed_at=date(2026, 4, 7), price=829000, price_per_m2=11128),
                PriceHistoryPoint(observed_at=date(2026, 5, 30), price=815000, price_per_m2=10940),
                PriceHistoryPoint(observed_at=date(2026, 6, 27), price=799000, price_per_m2=10725),
            ],
            "med-001": [
                PriceHistoryPoint(observed_at=date(2026, 4, 21), price=629000, price_per_m2=10466),
                PriceHistoryPoint(observed_at=date(2026, 6, 14), price=612000, price_per_m2=10183),
            ],
            "med-002": [
                PriceHistoryPoint(observed_at=date(2026, 5, 9), price=639000, price_per_m2=10979),
            ],
            "med-003": [
                PriceHistoryPoint(observed_at=date(2026, 3, 18), price=789000, price_per_m2=10883),
                PriceHistoryPoint(observed_at=date(2026, 5, 30), price=775000, price_per_m2=10690),
                PriceHistoryPoint(observed_at=date(2026, 6, 29), price=760000, price_per_m2=10483),
            ],
        }

    def list_listings(
        self,
        city: str | None = None,
        district: str | None = None,
        rooms: int | None = None,
        max_price: int | None = None,
        min_area_m2: float | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[Listing]:
        _validate_spatial_args(lat=lat, lon=lon, radius_km=radius_km)
        listings = list(self._listings.values())

        if city:
            listings = [item for item in listings if item.city.lower() == city.lower()]
        if district:
            listings = [item for item in listings if item.district.lower() == district.lower()]
        if rooms:
            listings = [item for item in listings if item.rooms == rooms]
        if max_price:
            listings = [item for item in listings if item.price <= max_price]
        if min_area_m2:
            listings = [item for item in listings if item.area_m2 >= min_area_m2]
        if bbox is not None or radius_km is not None:
            listings = [
                item
                for item in listings
                if _is_inside_spatial_window(
                    item.lat,
                    item.lon,
                    bbox=bbox,
                    center_lat=lat,
                    center_lon=lon,
                    radius_km=radius_km,
                )
            ]

        return listings

    def get_listing(self, listing_id: str) -> Listing | None:
        return self._listings.get(listing_id)

    def list_area_statistics(self) -> list[AreaStatistics]:
        return list(self._areas.values())

    def get_area_statistics(self, area_id: str) -> AreaStatistics | None:
        return self._areas.get(area_id)

    def list_municipalities(self) -> list[MunicipalityReference]:
        municipalities = []
        cities = sorted(
            {listing.city for listing in self._listings.values()},
            key=lambda item: (item.casefold() != "Wrocław".casefold(), item),
        )
        for city in cities:
            lat, lon = _centroid(
                (listing.lat, listing.lon)
                for listing in self._listings.values()
                if listing.city == city
            )
            municipalities.append(
                MunicipalityReference(
                    id=_municipality_id(city),
                    name=city,
                    country_code="PL",
                    region="Dolnośląskie",
                    lat=lat,
                    lon=lon,
                    metadata={"source": "demo_seed"},
                )
            )
        return municipalities

    def list_district_references(
        self,
        municipality_id: str | None = None,
        city: str | None = None,
    ) -> list[DistrictReference]:
        districts = []
        for area in sorted(self._areas.values(), key=lambda item: item.name):
            area_municipality_id = _municipality_id(area.city)
            if municipality_id and area_municipality_id != municipality_id:
                continue
            if city and area.city.casefold() != city.casefold():
                continue
            lat, lon = self._district_centroid(area.name)
            districts.append(
                DistrictReference(
                    id=area.area_id,
                    municipality_id=area_municipality_id,
                    municipality_name=area.city,
                    name=area.name,
                    slug=_slug(area.name),
                    area_id=area.area_id,
                    lat=lat,
                    lon=lon,
                    metadata={"source": "area_statistics"},
                )
            )
        return districts

    def list_location_references(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        location_type: LocationReferenceType | None = None,
        query: str | None = None,
        limit: int = 100,
    ) -> list[LocationReference]:
        districts_by_name = {
            (district.municipality_id, district.name): district
            for district in self.list_district_references()
        }
        references = []
        seen_ids = set()
        for listing in self._listings.values():
            listing_municipality_id = _municipality_id(listing.city)
            if municipality_id and listing_municipality_id != municipality_id:
                continue
            name = listing.address.split(",", maxsplit=1)[0].strip()
            if not name:
                continue
            district = districts_by_name.get((listing_municipality_id, listing.district))
            reference_id = f"{listing_municipality_id}-{_slug(name)}"
            if reference_id in seen_ids:
                continue
            seen_ids.add(reference_id)
            references.append(
                LocationReference(
                    id=reference_id,
                    municipality_id=listing_municipality_id,
                    municipality_name=listing.city,
                    district_id=district.id if district else None,
                    district_name=listing.district,
                    name=name,
                    slug=_slug(name),
                    location_type="neighborhood",
                    lat=listing.lat,
                    lon=listing.lon,
                    aliases=[listing.address],
                    metadata={"area_id": listing.area_id, "source_listing_id": listing.id},
                )
            )

        if district_id:
            references = [item for item in references if item.district_id == district_id]
        if location_type:
            references = [item for item in references if item.location_type == location_type]
        if query:
            query_key = query.casefold()
            references = [
                item
                for item in references
                if query_key in item.name.casefold()
                or query_key in item.slug.casefold()
                or any(query_key in alias.casefold() for alias in item.aliases)
            ]

        return sorted(references, key=lambda item: item.name)[:limit]

    def list_transport_stops(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportStopReference]:
        return _filter_infrastructure(
            self._transport_stops,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )

    def list_transport_routes(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportRouteReference]:
        return _filter_infrastructure(
            self._transport_routes,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )

    def list_schools(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[SchoolReference]:
        return _filter_infrastructure(
            self._schools,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )

    def list_kindergartens(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[KindergartenReference]:
        return _filter_infrastructure(
            self._kindergartens,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )

    def list_amenities(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        amenity_type: str | None = None,
        limit: int = 100,
    ) -> list[AmenityReference]:
        items = _filter_infrastructure(
            self._amenities,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )
        if amenity_type:
            items = [item for item in items if item.amenity_type == amenity_type]
        return items[:limit]

    def list_industrial_zones(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[IndustrialZoneReference]:
        return _filter_infrastructure(
            self._industrial_zones,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            limit=limit,
        )

    def list_planned_investments(
        self,
        city: str | None = None,
        district: str | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[PlannedInvestment]:
        _validate_spatial_args(lat=lat, lon=lon, radius_km=radius_km)
        investments = list(self._planned_investments.values())

        if city:
            investments = [item for item in investments if item.city.lower() == city.lower()]
        if district:
            investments = [
                item
                for item in investments
                if item.district is not None and item.district.lower() == district.lower()
            ]
        if bbox is not None or radius_km is not None:
            investments = [
                item
                for item in investments
                if _is_inside_spatial_window(
                    item.lat,
                    item.lon,
                    bbox=bbox,
                    center_lat=lat,
                    center_lon=lon,
                    radius_km=radius_km,
                )
            ]

        return investments

    def get_planned_investment(self, investment_id: str) -> PlannedInvestment | None:
        return self._planned_investments.get(investment_id)

    def create_planned_investment(
        self,
        payload: PlannedInvestmentCreate,
    ) -> PlannedInvestment:
        investment = PlannedInvestment(
            id=f"pi-{uuid4().hex[:8]}",
            **payload.model_dump(),
        )
        self._planned_investments[investment.id] = investment
        return investment

    def update_planned_investment(
        self,
        investment_id: str,
        payload: PlannedInvestmentUpdate,
    ) -> PlannedInvestment | None:
        investment = self._planned_investments.get(investment_id)
        if investment is None:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        updated = investment.model_copy(update=update_data)
        self._planned_investments[investment_id] = updated
        return updated

    def delete_planned_investment(self, investment_id: str) -> bool:
        return self._planned_investments.pop(investment_id, None) is not None

    def get_price_history(self, listing_id: str) -> list[PriceHistoryPoint]:
        return self._history.get(listing_id, [])

    def get_listing_events(self, listing_id: str) -> list[ListingEvent]:
        listing = self._listings.get(listing_id)
        history = self._history.get(listing_id, [])
        if listing is None or not history:
            return []

        snapshots = []
        for point in history:
            payload = listing.model_copy(
                update={
                    "price": point.price,
                    "price_per_m2": point.price_per_m2,
                }
            ).model_dump(mode="json")
            snapshots.append(
                ListingEventInput(
                    listing_id=listing_id,
                    observed_at=point.observed_at,
                    price=point.price,
                    price_per_m2=point.price_per_m2,
                    payload=payload,
                )
            )

        return [event.to_schema() for event in derive_listing_events(snapshots)]

    def find_comparables(self, listing: Listing, limit: int = 5) -> list[Listing]:
        candidates = [
            candidate
            for candidate in self._listings.values()
            if candidate.id != listing.id
            and candidate.city == listing.city
            and abs(candidate.area_m2 - listing.area_m2) <= 25
        ]

        return sorted(
            candidates,
            key=lambda candidate: (
                candidate.district != listing.district,
                abs(candidate.rooms - listing.rooms),
                abs(candidate.price_per_m2 - listing.price_per_m2),
            ),
        )[:limit]

    def _district_centroid(self, district: str) -> tuple[float | None, float | None]:
        return _centroid(
            (listing.lat, listing.lon)
            for listing in self._listings.values()
            if listing.district == district
        )


def _validate_spatial_args(
    *,
    lat: float | None,
    lon: float | None,
    radius_km: float | None,
) -> None:
    if radius_km is not None and (lat is None or lon is None):
        raise ValueError("radius_km requires lat and lon")


def _is_inside_spatial_window(
    lat: float,
    lon: float,
    *,
    bbox: BBox | None,
    center_lat: float | None,
    center_lon: float | None,
    radius_km: float | None,
) -> bool:
    if bbox is not None:
        min_lon, min_lat, max_lon, max_lat = bbox
        if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
            return False

    if radius_km is not None:
        distance_km = _haversine_km(center_lat or 0, center_lon or 0, lat, lon)
        if distance_km > radius_km:
            return False

    return True


def _haversine_km(lat_1: float, lon_1: float, lat_2: float, lon_2: float) -> float:
    radius = 6371.0
    delta_lat = radians(lat_2 - lat_1)
    delta_lon = radians(lon_2 - lon_1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat_1)) * cos(radians(lat_2)) * sin(delta_lon / 2) ** 2
    )
    return 2 * radius * asin(sqrt(a))


def _centroid(points: Iterable[tuple[float, float]]) -> tuple[float | None, float | None]:
    values = list(points)
    if not values:
        return None, None
    return (
        round(sum(point[0] for point in values) / len(values), 6),
        round(sum(point[1] for point in values) / len(values), 6),
    )


def _slug(value: str) -> str:
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
    return re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")


def _municipality_id(city: str) -> str:
    return _slug(city)


def _filter_infrastructure(
    items: Iterable,
    *,
    municipality_id: str | None,
    district_id: str | None,
    city: str | None,
    limit: int,
) -> list:
    if city and city.casefold() != "Wrocław".casefold():
        return []

    filtered = list(items)
    if municipality_id:
        filtered = [item for item in filtered if item.municipality_id == municipality_id]
    if district_id:
        filtered = [item for item in filtered if item.district_id == district_id]

    return sorted(
        filtered,
        key=lambda item: getattr(item, "name", getattr(item, "route_name", "")),
    )[:limit]
