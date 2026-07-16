import csv
import re
import unicodedata
from collections.abc import Iterable
from datetime import date
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from uuid import uuid4

from domarion.ingestion.partner_csv import read_partner_csv
from domarion.repositories.base import BBox
from domarion.schemas import (
    AmenityReference,
    AreaStatistics,
    DeveloperProfile,
    DeveloperProject,
    DeveloperQualitySignal,
    DeveloperReputation,
    DeveloperSourceCitation,
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
        }
        self._load_area_statistics_sample("area_statistics_suburban.csv")

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
        }
        self._load_partner_listing_sample("partner_listings_suburban.csv")

        self._developer_profiles = {
            "demo-development": DeveloperProfile(
                id="demo-development",
                name="Demo Development",
                legal_name="Demo Development S.A.",
                brand_names=["Demo Developer"],
                krs="0000123456",
                nip="8990000001",
                regon="930000001",
                website_url="https://example-developer.test",
                headquarters_city="Wrocław",
                founded_year=2012,
                source_names=["Demo Developer Feed", "KRS/REGON sample"],
                updated_at=date(2026, 7, 10),
            ),
            "fabryczna-estate-partners": DeveloperProfile(
                id="fabryczna-estate-partners",
                name="Fabryczna Estate Partners",
                legal_name="Fabryczna Estate Partners sp. z o.o.",
                brand_names=["FEP"],
                krs="0000234567",
                nip="8990000002",
                regon="930000002",
                website_url="https://example.com/developers/fep",
                headquarters_city="Wrocław",
                founded_year=2008,
                source_names=["Partner Agency Demo", "Manual due diligence sample"],
                updated_at=date(2026, 7, 10),
            ),
            "green-north-homes": DeveloperProfile(
                id="green-north-homes",
                name="Green North Homes",
                legal_name="Green North Homes sp. z o.o.",
                brand_names=["Green North"],
                krs="0000345678",
                nip="8990000003",
                regon="930000003",
                website_url="https://example.com/developers/green-north",
                headquarters_city="Wrocław",
                founded_year=2016,
                source_names=["Partner Agency Demo", "Technical acceptance sample"],
                updated_at=date(2026, 7, 10),
            ),
        }
        self._developer_projects = [
            DeveloperProject(
                id="demo-jagodno-gardens",
                developer_id="demo-development",
                name="Jagodno Gardens",
                city="Wrocław",
                district="Krzyki",
                status="active",
                units_count=148,
                completed_year=None,
                source_url="https://example-developer.test/projects/jagodno-gardens",
            ),
            DeveloperProject(
                id="demo-krzyki-park",
                developer_id="demo-development",
                name="Krzyki Park Residence",
                city="Wrocław",
                district="Krzyki",
                status="completed",
                units_count=96,
                completed_year=2024,
                source_url="https://example-developer.test/projects/krzyki-park",
            ),
            DeveloperProject(
                id="fep-nowy-dwor",
                developer_id="fabryczna-estate-partners",
                name="Nowy Dwór Residence",
                city="Wrocław",
                district="Fabryczna",
                status="completed",
                units_count=120,
                completed_year=2012,
                source_url="https://example.com/developers/fep/nowy-dwor",
            ),
            DeveloperProject(
                id="green-north-soltysowice",
                developer_id="green-north-homes",
                name="Sołtysowice Green",
                city="Wrocław",
                district="Psie Pole",
                status="completed",
                units_count=84,
                completed_year=2007,
                source_url="https://example.com/developers/green-north/soltysowice",
            ),
        ]
        self._developer_quality_signals = [
            DeveloperQualitySignal(
                id="demo-transparency",
                developer_id="demo-development",
                signal_type="transparency",
                severity="positive",
                title="Clear investment documentation",
                summary="Sample feed includes project pages, schedules and contact-free metadata.",
                source_name="Demo Developer Feed",
                source_url="https://example-developer.test",
                observed_at=date(2026, 7, 10),
                confidence_score=72,
            ),
            DeveloperQualitySignal(
                id="demo-local-track-record",
                developer_id="demo-development",
                signal_type="local_market",
                severity="positive",
                title="Recent Wrocław project experience",
                summary="Two sample projects are linked to Wrocław districts in the demo dataset.",
                source_name="Demo Developer Feed",
                source_url="https://example-developer.test/projects",
                observed_at=date(2026, 7, 10),
                confidence_score=68,
            ),
            DeveloperQualitySignal(
                id="fep-track-record",
                developer_id="fabryczna-estate-partners",
                signal_type="track_record",
                severity="info",
                title="Older completed project",
                summary=(
                    "The linked building was completed in 2012; "
                    "verify current management and defects."
                ),
                source_name="Partner Agency Demo",
                source_url="https://example.com/listings/wr-001",
                observed_at=date(2026, 7, 10),
                confidence_score=55,
            ),
            DeveloperQualitySignal(
                id="green-north-defects",
                developer_id="green-north-homes",
                signal_type="technical_quality",
                severity="warning",
                title="Manual inspection recommended",
                summary="Older low-rise stock; check roof, insulation and common-area maintenance.",
                source_name="Technical acceptance sample",
                source_url="https://example.com/developers/green-north/quality",
                observed_at=date(2026, 7, 10),
                confidence_score=58,
            ),
        ]
        self._listing_developer_map = {
            "wr-001": "fabryczna-estate-partners",
            "wr-002": "demo-development",
            "wr-003": "green-north-homes",
            "partner-002": "demo-development",
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
            AmenityReference(
                id="amenity-wroclaw-fabryczna-healthcare-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Healthcare Clinic Fabryczna",
                amenity_type="healthcare",
                lat=51.1116,
                lon=16.9558,
                source_url="https://example.com/open-data/amenities/fabryczna-healthcare-demo",
                metadata={"source": "demo_seed"},
            ),
            AmenityReference(
                id="amenity-wroclaw-nowy-dwor-retail-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Retail Hub Nowy Dwór",
                amenity_type="retail",
                lat=51.1109,
                lon=16.9641,
                source_url="https://example.com/open-data/amenities/nowy-dwor-retail-demo",
                metadata={"source": "demo_seed"},
            ),
            AmenityReference(
                id="amenity-wroclaw-muchobor-office-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo Office Hub Muchobór",
                amenity_type="office",
                lat=51.1084,
                lon=16.9912,
                source_url="https://example.com/open-data/amenities/muchobor-office-demo",
                metadata={"source": "demo_seed"},
            ),
            AmenityReference(
                id="amenity-wroclaw-grabiszyn-university-demo",
                municipality_id="wroclaw",
                municipality_name="Wrocław",
                district_id="wroclaw-fabryczna",
                district_name="Fabryczna",
                name="Demo University Campus Grabiszyn",
                amenity_type="university",
                lat=51.1005,
                lon=17.0022,
                source_url="https://example.com/open-data/amenities/grabiszyn-university-demo",
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
        municipality: str | None = None,
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
        if municipality:
            municipality_key = municipality.casefold()
            listings = [
                item for item in listings if item.municipality.casefold() == municipality_key
            ]
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

    def list_developer_reputations(
        self,
        city: str | None = None,
    ) -> list[DeveloperReputation]:
        reputations = [
            reputation
            for developer_id in self._developer_profiles
            if (reputation := self._build_developer_reputation(developer_id)) is not None
        ]
        if city:
            city_key = city.casefold()
            reputations = [
                item
                for item in reputations
                if any(project.city.casefold() == city_key for project in item.projects)
            ]

        return sorted(
            reputations,
            key=lambda item: (
                item.reputation_score,
                item.confidence_score,
                item.completed_projects_count,
            ),
            reverse=True,
        )

    def get_developer_reputation(self, developer_id: str) -> DeveloperReputation | None:
        return self._build_developer_reputation(developer_id)

    def get_developer_reputation_for_listing(
        self,
        listing_id: str,
    ) -> DeveloperReputation | None:
        developer_id = self._listing_developer_map.get(listing_id)
        if developer_id is None:
            return None
        return self._build_developer_reputation(developer_id)

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

    def _build_developer_reputation(
        self,
        developer_id: str,
    ) -> DeveloperReputation | None:
        profile = self._developer_profiles.get(developer_id)
        if profile is None:
            return None

        projects = self._developer_projects_for(developer_id)
        signals = self._developer_signals_for(developer_id)
        completed_projects_count = sum(1 for project in projects if project.status == "completed")
        active_projects_count = sum(1 for project in projects if project.status == "active")
        local_projects_count = sum(
            1 for project in projects if project.city.casefold() == "Wrocław".casefold()
        )

        track_record_score = _clamp_score(
            45 + completed_projects_count * 13 + active_projects_count * 4
        )
        delivery_score = _developer_factor_score(signals, "delivery", base=62)
        technical_quality_score = _developer_factor_score(signals, "technical_quality", base=64)
        legal_compliance_score = _developer_factor_score(signals, "legal", base=66)
        financial_stability_score = _developer_factor_score(signals, "financial", base=62)
        transparency_score = _developer_factor_score(signals, "transparency", base=58)
        local_experience_score = _clamp_score(42 + local_projects_count * 12)

        reputation_score = _clamp_score(
            track_record_score * 0.20
            + delivery_score * 0.15
            + technical_quality_score * 0.17
            + legal_compliance_score * 0.14
            + financial_stability_score * 0.12
            + transparency_score * 0.10
            + local_experience_score * 0.12
        )
        confidence_score = _clamp_score(
            34
            + len(set(profile.source_names)) * 8
            + min(len(signals), 8) * 5
            + min(len(projects), 10) * 4
        )
        risk_signals = [
            signal.summary
            for signal in signals
            if signal.severity in {"warning", "risk"}
        ]
        positive_signals = [
            signal.summary
            for signal in signals
            if signal.severity == "positive"
        ]

        if any(signal.severity == "risk" for signal in signals):
            label = "risk_review"
        elif reputation_score >= 75 and confidence_score >= 60:
            label = "strong"
        elif reputation_score >= 65:
            label = "good"
        elif reputation_score >= 52:
            label = "mixed"
        else:
            label = "limited_data"

        return DeveloperReputation(
            developer=profile,
            reputation_score=reputation_score,
            confidence_score=confidence_score,
            label=label,
            track_record_score=track_record_score,
            delivery_score=delivery_score,
            technical_quality_score=technical_quality_score,
            legal_compliance_score=legal_compliance_score,
            financial_stability_score=financial_stability_score,
            transparency_score=transparency_score,
            local_experience_score=local_experience_score,
            completed_projects_count=completed_projects_count,
            active_projects_count=active_projects_count,
            positive_signals=positive_signals,
            risk_signals=risk_signals,
            due_diligence_questions=_developer_due_diligence_questions(
                reputation_score=reputation_score,
                confidence_score=confidence_score,
                risk_signals=risk_signals,
                active_projects_count=active_projects_count,
            ),
            source_citations=_developer_source_citations(profile, signals),
            projects=projects,
            quality_signals=signals,
        )

    def _developer_projects_for(self, developer_id: str) -> list[DeveloperProject]:
        return sorted(
            [
                project
                for project in self._developer_projects
                if project.developer_id == developer_id
            ],
            key=lambda project: (
                project.status != "active",
                -(project.completed_year or 0),
                project.name,
            ),
        )

    def _developer_signals_for(self, developer_id: str) -> list[DeveloperQualitySignal]:
        return sorted(
            [
                signal
                for signal in self._developer_quality_signals
                if signal.developer_id == developer_id
            ],
            key=lambda signal: (signal.severity != "risk", signal.severity, signal.title),
        )

    def _load_area_statistics_sample(self, file_name: str) -> None:
        sample_path = Path(__file__).resolve().parents[2] / "data" / "samples" / file_name
        if not sample_path.exists():
            return
        with sample_path.open("r", encoding="utf-8-sig", newline="") as file:
            for row in csv.DictReader(file):
                area = AreaStatistics(
                    area_id=row["area_id"],
                    name=row["name"],
                    city=row["city"],
                    median_price_per_m2=int(row["median_price_per_m2"]),
                    average_price_per_m2=int(row["average_price_per_m2"]),
                    active_listings=int(row["active_listings"]),
                    new_listings_30d=int(row["new_listings_30d"]),
                    removed_listings_30d=int(row["removed_listings_30d"]),
                    average_days_on_market=int(row["average_days_on_market"]),
                    price_change_90d_pct=float(row["price_change_90d_pct"]),
                    supply_change_90d_pct=float(row["supply_change_90d_pct"]),
                )
                self._areas[area.area_id] = area

    def _load_partner_listing_sample(self, file_name: str) -> None:
        sample_path = Path(__file__).resolve().parents[2] / "data" / "samples" / file_name
        if not sample_path.exists():
            return
        records = read_partner_csv(
            sample_path,
            default_source_name="Demo Suburban Partner Feed",
            default_source_type="partner_csv",
        )
        for record in records:
            self._listings[record.listing.id] = record.listing

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


def _developer_factor_score(
    signals: list[DeveloperQualitySignal],
    signal_type: str,
    *,
    base: int,
) -> int:
    score = base
    for signal in signals:
        if signal.signal_type != signal_type:
            continue
        if signal.severity == "positive":
            score += 12
        elif signal.severity == "info":
            score += 3
        elif signal.severity == "warning":
            score -= 14
        elif signal.severity == "risk":
            score -= 28
    return _clamp_score(score)


def _developer_due_diligence_questions(
    *,
    reputation_score: int,
    confidence_score: int,
    risk_signals: list[str],
    active_projects_count: int,
) -> list[str]:
    questions = [
        "Запросить стандарт девелоперского договора, prospekt informacyjny и график платежей.",
        "Проверить KRS/REGON/NIP, представительство подписанта и отсутствие явных судебных рисков.",
        (
            "Сверить разрешение на строительство, rachunek powierniczy "
            "и статус Deweloperski Fundusz Gwarancyjny."
        ),
    ]
    if active_projects_count:
        questions.append(
            "По активному проекту проверить срок сдачи, этап строительства и штрафы за задержку."
        )
    if reputation_score < 65 or risk_signals:
        questions.append(
            "Заказать техническую приемку и проверить отзывы жильцов по уже сданным объектам."
        )
    if confidence_score < 65:
        questions.append(
            "Данных пока мало: подтвердить историю проектов минимум из двух независимых источников."
        )
    return questions


def _developer_source_citations(
    profile: DeveloperProfile,
    signals: list[DeveloperQualitySignal],
) -> list[DeveloperSourceCitation]:
    citations = [
        DeveloperSourceCitation(
            source_name=source_name,
            source_url=profile.website_url,
            checked_at=profile.updated_at,
            note=(
                "Sample or partner source; replace with verified registry data "
                "before paid decisions."
            ),
        )
        for source_name in profile.source_names
    ]
    seen = {citation.source_name for citation in citations}
    for signal in signals:
        if signal.source_name in seen:
            continue
        seen.add(signal.source_name)
        citations.append(
            DeveloperSourceCitation(
                source_name=signal.source_name,
                source_url=signal.source_url,
                checked_at=signal.observed_at or profile.updated_at,
                note=signal.title,
            )
        )
    return citations


def _clamp_score(value: float) -> int:
    return int(max(0, min(100, round(value))))


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
