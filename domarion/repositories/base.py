from typing import Protocol

from domarion.schemas import AreaStatistics, Listing, PriceHistoryPoint


class RealEstateRepository(Protocol):
    def list_listings(
        self,
        city: str | None = None,
        district: str | None = None,
        rooms: int | None = None,
        max_price: int | None = None,
        min_area_m2: float | None = None,
    ) -> list[Listing]:
        raise NotImplementedError

    def get_listing(self, listing_id: str) -> Listing | None:
        raise NotImplementedError

    def list_area_statistics(self) -> list[AreaStatistics]:
        raise NotImplementedError

    def get_area_statistics(self, area_id: str) -> AreaStatistics | None:
        raise NotImplementedError

    def get_price_history(self, listing_id: str) -> list[PriceHistoryPoint]:
        raise NotImplementedError

    def find_comparables(self, listing: Listing, limit: int = 5) -> list[Listing]:
        raise NotImplementedError

