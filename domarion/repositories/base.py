from typing import Protocol

from domarion.schemas import (
    AmenityReference,
    AreaStatistics,
    DeveloperReputation,
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

BBox = tuple[float, float, float, float]


class RealEstateRepository(Protocol):
    def list_listings(
        self,
        voivodeship: str | None = None,
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
        raise NotImplementedError

    def get_listing(self, listing_id: str) -> Listing | None:
        raise NotImplementedError

    def list_area_statistics(self) -> list[AreaStatistics]:
        raise NotImplementedError

    def get_area_statistics(self, area_id: str) -> AreaStatistics | None:
        raise NotImplementedError

    def list_developer_reputations(
        self,
        city: str | None = None,
    ) -> list[DeveloperReputation]:
        raise NotImplementedError

    def get_developer_reputation(self, developer_id: str) -> DeveloperReputation | None:
        raise NotImplementedError

    def get_developer_reputation_for_listing(
        self,
        listing_id: str,
    ) -> DeveloperReputation | None:
        raise NotImplementedError

    def list_municipalities(self) -> list[MunicipalityReference]:
        raise NotImplementedError

    def list_district_references(
        self,
        municipality_id: str | None = None,
        city: str | None = None,
    ) -> list[DistrictReference]:
        raise NotImplementedError

    def list_location_references(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        location_type: LocationReferenceType | None = None,
        query: str | None = None,
        limit: int = 100,
    ) -> list[LocationReference]:
        raise NotImplementedError

    def list_transport_stops(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportStopReference]:
        raise NotImplementedError

    def list_transport_routes(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportRouteReference]:
        raise NotImplementedError

    def list_schools(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[SchoolReference]:
        raise NotImplementedError

    def list_kindergartens(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[KindergartenReference]:
        raise NotImplementedError

    def list_amenities(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        amenity_type: str | None = None,
        limit: int = 100,
    ) -> list[AmenityReference]:
        raise NotImplementedError

    def list_industrial_zones(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[IndustrialZoneReference]:
        raise NotImplementedError

    def list_planned_investments(
        self,
        city: str | None = None,
        district: str | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[PlannedInvestment]:
        raise NotImplementedError

    def get_planned_investment(self, investment_id: str) -> PlannedInvestment | None:
        raise NotImplementedError

    def create_planned_investment(
        self,
        payload: PlannedInvestmentCreate,
    ) -> PlannedInvestment:
        raise NotImplementedError

    def update_planned_investment(
        self,
        investment_id: str,
        payload: PlannedInvestmentUpdate,
    ) -> PlannedInvestment | None:
        raise NotImplementedError

    def delete_planned_investment(self, investment_id: str) -> bool:
        raise NotImplementedError

    def get_price_history(self, listing_id: str) -> list[PriceHistoryPoint]:
        raise NotImplementedError

    def get_listing_events(self, listing_id: str) -> list[ListingEvent]:
        raise NotImplementedError

    def find_comparables(self, listing: Listing, limit: int = 5) -> list[Listing]:
        raise NotImplementedError
