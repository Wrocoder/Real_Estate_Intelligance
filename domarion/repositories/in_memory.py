from datetime import date

from domarion.schemas import AreaStatistics, Listing, PlannedInvestment, PriceHistoryPoint


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
        }

    def list_listings(
        self,
        city: str | None = None,
        district: str | None = None,
        rooms: int | None = None,
        max_price: int | None = None,
        min_area_m2: float | None = None,
    ) -> list[Listing]:
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

        return listings

    def get_listing(self, listing_id: str) -> Listing | None:
        return self._listings.get(listing_id)

    def list_area_statistics(self) -> list[AreaStatistics]:
        return list(self._areas.values())

    def get_area_statistics(self, area_id: str) -> AreaStatistics | None:
        return self._areas.get(area_id)

    def list_planned_investments(
        self,
        city: str | None = None,
        district: str | None = None,
    ) -> list[PlannedInvestment]:
        investments = list(self._planned_investments.values())

        if city:
            investments = [item for item in investments if item.city.lower() == city.lower()]
        if district:
            investments = [
                item
                for item in investments
                if item.district is not None and item.district.lower() == district.lower()
            ]

        return investments

    def get_price_history(self, listing_id: str) -> list[PriceHistoryPoint]:
        return self._history.get(listing_id, [])

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
