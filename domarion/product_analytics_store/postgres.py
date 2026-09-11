from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from domarion.db.models import ProductAnalyticsEvent
from domarion.product_analytics_store.base import PRODUCT_EVENT_RETENTION_DAYS
from domarion.schemas import ProductEventCreate, ProductEventName


class PostgresProductAnalyticsStore:
    def __init__(self, session: Session) -> None:
        self.session = session

    def record_event(self, payload: ProductEventCreate, created_at: datetime) -> None:
        self.session.execute(
            delete(ProductAnalyticsEvent).where(
                ProductAnalyticsEvent.created_at
                < created_at - timedelta(days=PRODUCT_EVENT_RETENTION_DAYS)
            )
        )
        self.session.add(
            ProductAnalyticsEvent(
                id=str(uuid4()),
                journey_id=str(payload.journey_id),
                event_name=payload.event_name,
                schema_version=payload.schema_version,
                locale=payload.locale,
                properties_json=payload.properties,
                created_at=created_at,
            )
        )
        self.session.commit()

    def summarize(
        self,
        since: datetime,
    ) -> tuple[int, int, dict[ProductEventName, tuple[int, int]]]:
        total_events, unique_journeys = self.session.execute(
            select(
                func.count(ProductAnalyticsEvent.id),
                func.count(distinct(ProductAnalyticsEvent.journey_id)),
            ).where(ProductAnalyticsEvent.created_at >= since)
        ).one()
        rows = self.session.execute(
            select(
                ProductAnalyticsEvent.event_name,
                func.count(ProductAnalyticsEvent.id),
                func.count(distinct(ProductAnalyticsEvent.journey_id)),
            )
            .where(ProductAnalyticsEvent.created_at >= since)
            .group_by(ProductAnalyticsEvent.event_name)
        ).all()
        counts: dict[ProductEventName, tuple[int, int]] = {
            event_name: (event_count, journey_count)
            for event_name, event_count, journey_count in rows
        }
        return total_events, unique_journeys, counts
