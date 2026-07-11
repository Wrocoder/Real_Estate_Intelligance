from datetime import datetime

from sqlalchemy.orm import Session

from domarion.db.models import AreaMarketSnapshot as AreaMarketSnapshotRow
from domarion.repositories.base import RealEstateRepository
from domarion.schemas import (
    AreaMarketSnapshot,
    AreaMarketSnapshotJobResult,
)


def build_area_market_snapshots(
    repository: RealEstateRepository,
    calculated_at: datetime | None = None,
) -> list[AreaMarketSnapshot]:
    timestamp = calculated_at or datetime.utcnow()
    return [
        AreaMarketSnapshot(
            id=None,
            area_id=area.area_id,
            name=area.name,
            city=area.city,
            median_price_per_m2=area.median_price_per_m2,
            average_price_per_m2=area.average_price_per_m2,
            active_listings=area.active_listings,
            new_listings_30d=area.new_listings_30d,
            removed_listings_30d=area.removed_listings_30d,
            average_days_on_market=area.average_days_on_market,
            price_change_90d_pct=area.price_change_90d_pct,
            supply_change_90d_pct=area.supply_change_90d_pct,
            calculated_at=timestamp,
        )
        for area in sorted(repository.list_area_statistics(), key=lambda item: item.area_id)
    ]


def run_area_market_snapshot_job(
    repository: RealEstateRepository,
    session: Session | None = None,
    dry_run: bool = True,
    calculated_at: datetime | None = None,
) -> AreaMarketSnapshotJobResult:
    snapshots = build_area_market_snapshots(repository, calculated_at=calculated_at)
    snapshots_created = 0
    if not dry_run:
        if session is None:
            raise ValueError("A database session is required to persist area market snapshots")
        snapshots_created = persist_area_market_snapshots(session, snapshots)

    timestamp = snapshots[0].calculated_at if snapshots else calculated_at or datetime.utcnow()
    return AreaMarketSnapshotJobResult(
        calculated_at=timestamp,
        dry_run=dry_run,
        snapshots_created=snapshots_created,
        snapshots=snapshots,
    )


def persist_area_market_snapshots(
    session: Session,
    snapshots: list[AreaMarketSnapshot],
) -> int:
    for snapshot in snapshots:
        session.add(
            AreaMarketSnapshotRow(
                area_id=snapshot.area_id,
                name=snapshot.name,
                city=snapshot.city,
                median_price_per_m2=snapshot.median_price_per_m2,
                average_price_per_m2=snapshot.average_price_per_m2,
                active_listings=snapshot.active_listings,
                new_listings_30d=snapshot.new_listings_30d,
                removed_listings_30d=snapshot.removed_listings_30d,
                average_days_on_market=snapshot.average_days_on_market,
                price_change_90d_pct=snapshot.price_change_90d_pct,
                supply_change_90d_pct=snapshot.supply_change_90d_pct,
                calculated_at=snapshot.calculated_at,
            )
        )
    session.flush()
    return len(snapshots)
