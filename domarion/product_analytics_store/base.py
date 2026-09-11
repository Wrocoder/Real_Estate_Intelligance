from collections.abc import Mapping
from datetime import datetime
from typing import Protocol

from domarion.schemas import ProductEventCreate, ProductEventName

PRODUCT_EVENT_RETENTION_DAYS = 180


class ProductAnalyticsStore(Protocol):
    def record_event(self, payload: ProductEventCreate, created_at: datetime) -> None:
        raise NotImplementedError

    def summarize(
        self,
        since: datetime,
    ) -> tuple[int, int, Mapping[ProductEventName, tuple[int, int]]]:
        raise NotImplementedError
