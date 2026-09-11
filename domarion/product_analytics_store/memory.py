from collections import Counter, defaultdict
from datetime import datetime, timedelta

from domarion.product_analytics_store.base import PRODUCT_EVENT_RETENTION_DAYS
from domarion.schemas import ProductEventCreate, ProductEventName


class InMemoryProductAnalyticsStore:
    def __init__(self) -> None:
        self._events: list[tuple[ProductEventCreate, datetime]] = []

    def record_event(self, payload: ProductEventCreate, created_at: datetime) -> None:
        retention_cutoff = created_at - timedelta(days=PRODUCT_EVENT_RETENTION_DAYS)
        self._events = [item for item in self._events if item[1] >= retention_cutoff]
        self._events.append((payload, created_at))

    def summarize(
        self,
        since: datetime,
    ) -> tuple[int, int, dict[ProductEventName, tuple[int, int]]]:
        events = [item for item in self._events if item[1] >= since]
        event_counts: Counter[ProductEventName] = Counter(item[0].event_name for item in events)
        journeys: dict[ProductEventName, set[str]] = defaultdict(set)
        for payload, _created_at in events:
            journeys[payload.event_name].add(str(payload.journey_id))
        counts = {
            event_name: (event_count, len(journeys[event_name]))
            for event_name, event_count in event_counts.items()
        }
        return len(events), len({str(item[0].journey_id) for item in events}), counts

    def clear(self) -> None:
        self._events.clear()
