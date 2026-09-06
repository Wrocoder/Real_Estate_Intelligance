"""Rebuild market metrics from independent listing and transaction evidence."""

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from statistics import mean, median

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from domarion.db.models import (
    AreaStatistic,
    ListingEvent,
    ListingSnapshot,
    ListingSource,
    Property,
    PropertySource,
    TransactionObservation,
)
from domarion.ingestion.partner_csv import slugify
from domarion.repositories.postgres import PostgresRealEstateRepository
from domarion.services.transaction_versions import latest_transaction_versions

TRANSACTION_LOOKBACK_DAYS = 1095


def refresh_market_metrics(
    session: Session,
    *,
    city: str = "Wrocław",
    minimum_quality: int = 60,
    now: datetime | None = None,
) -> dict[str, object]:
    """Refresh area statistics without turning transactions into listings."""

    calculated_at = now or datetime.now(UTC).replace(tzinfo=None)
    repository = PostgresRealEstateRepository(session, include_demo_data=False)
    listings = [
        listing
        for listing in repository.list_listings(city=city)
        if listing.data_quality_score >= minimum_quality
    ]
    transactions = _load_transactions(
        session,
        city=city,
        minimum_quality=minimum_quality,
        cutoff=calculated_at - timedelta(days=TRANSACTION_LOOKBACK_DAYS),
    )

    session.execute(delete(AreaStatistic).where(AreaStatistic.city == city))
    if not listings and not transactions:
        return {
            "city": city,
            "areas_updated": 0,
            "active_listings": 0,
            "transaction_observations": 0,
            "minimum_quality": minimum_quality,
            "calculated_at": calculated_at.isoformat(),
            "status": "no_live_market_observations",
        }

    snapshots = session.scalars(
        select(ListingSnapshot)
        .join(PropertySource, PropertySource.id == ListingSnapshot.property_source_id)
        .join(Property, Property.id == PropertySource.property_id)
        .join(ListingSource, ListingSource.id == PropertySource.source_id)
        .where(
            Property.city == city,
            ListingSource.is_demo.is_(False),
            ListingSource.is_active.is_(True),
            ListingSource.legal_status == "approved",
        )
        .order_by(ListingSnapshot.observed_at)
    ).all()
    snapshots_by_listing: dict[str, list[ListingSnapshot]] = defaultdict(list)
    for snapshot in snapshots:
        listing_id = snapshot.normalized_payload.get("id")
        if listing_id:
            snapshots_by_listing[str(listing_id)].append(snapshot)

    current_by_area: dict[str, list] = defaultdict(list)
    for listing in listings:
        current_by_area[listing.area_id].append(listing)
    city_area_id = slugify(f"{city}-city")
    transactions_by_area: dict[str, list[TransactionObservation]] = defaultdict(list)
    for transaction in transactions:
        transactions_by_area[transaction.area_id or city_area_id].append(transaction)
    if transactions:
        transactions_by_area[city_area_id] = list(transactions)

    new_cutoff = calculated_at - timedelta(days=30)
    baseline_cutoff = calculated_at - timedelta(days=90)
    removed_by_area = _removed_counts(session, city=city, cutoff=new_cutoff)
    areas_updated = 0
    for area_id in sorted(set(current_by_area) | set(transactions_by_area)):
        area_listings = current_by_area.get(area_id, [])
        area_transactions = transactions_by_area.get(area_id, [])
        listing_prices = [item.price_per_m2 for item in area_listings]
        transaction_prices = [float(item.price_per_m2) for item in area_transactions]
        prices = transaction_prices or listing_prices
        if not prices:
            continue

        if area_transactions:
            current_median = median(transaction_prices)
            current_average = mean(transaction_prices)
            transaction_baseline = [
                float(item.price_per_m2)
                for item in area_transactions
                if item.transaction_date <= baseline_cutoff
            ]
            baseline_median = median(transaction_baseline) if transaction_baseline else None
            price_basis = "transaction_observed"
        else:
            current_median = median(listing_prices)
            current_average = mean(listing_prices)
            baseline_median = _listing_baseline_median(
                area_listings,
                snapshots_by_listing,
                baseline_cutoff,
            )
            price_basis = "listing_observed"
        price_change = (
            round((current_median - baseline_median) / baseline_median * 100, 2)
            if baseline_median
            else 0.0
        )

        baseline_supply = _listing_baseline_supply(
            area_listings,
            snapshots_by_listing,
            baseline_cutoff,
        )
        supply_change = (
            round((len(area_listings) - baseline_supply) / baseline_supply * 100, 2)
            if baseline_supply
            else 0.0
        )
        if area_id == city_area_id:
            area_name = city
        else:
            names = [item.district for item in area_listings if item.district]
            names.extend(item.district for item in area_transactions if item.district)
            area_name = names[0] if names else area_id
        existing = session.get(AreaStatistic, area_id)
        if existing is None:
            existing = AreaStatistic(area_id=area_id)
            session.add(existing)
        existing.name = area_name
        existing.city = city
        existing.median_price_per_m2 = round(current_median)
        existing.average_price_per_m2 = round(current_average)
        existing.active_listings = len(area_listings)
        existing.new_listings_30d = sum(
            int(item.first_seen_at >= new_cutoff.date()) for item in area_listings
        )
        existing.removed_listings_30d = removed_by_area.get(area_id, 0)
        existing.average_days_on_market = (
            round(mean(item.days_on_market for item in area_listings)) if area_listings else 0
        )
        existing.price_change_90d_pct = price_change
        existing.supply_change_90d_pct = supply_change
        existing.price_basis = price_basis
        existing.listing_metrics_available = bool(area_listings)
        existing.transaction_observation_count = len(area_transactions)
        existing.transaction_median_price_per_m2 = (
            round(median(transaction_prices)) if transaction_prices else None
        )
        existing.transaction_observed_from = (
            min(item.transaction_date for item in area_transactions) if area_transactions else None
        )
        existing.transaction_observed_to = (
            max(item.transaction_date for item in area_transactions) if area_transactions else None
        )
        existing.data_sources_json = _source_names(area_transactions)
        existing.calculated_at = calculated_at
        areas_updated += 1

    session.flush()
    return {
        "city": city,
        "areas_updated": areas_updated,
        "active_listings": len(listings),
        "transaction_observations": len(transactions),
        "minimum_quality": minimum_quality,
        "calculated_at": calculated_at.isoformat(),
        "status": "updated",
    }


def _load_transactions(
    session: Session,
    *,
    city: str,
    minimum_quality: int,
    cutoff: datetime,
) -> list[TransactionObservation]:
    rows = session.scalars(
        select(TransactionObservation)
        .join(ListingSource, ListingSource.id == TransactionObservation.source_id)
        .where(
            TransactionObservation.city == city,
            ListingSource.is_demo.is_(False),
            ListingSource.is_active.is_(True),
            ListingSource.legal_status == "approved",
        )
        .order_by(TransactionObservation.transaction_date)
    ).all()
    current_versions = latest_transaction_versions(rows)
    return [
        row
        for row in current_versions
        if row.transaction_date >= cutoff
        and row.data_quality_score >= minimum_quality
        and getattr(row, "price_per_m2", None) is not None
        and float(row.price_per_m2) > 0
    ]


def _listing_baseline_median(
    listings: list,
    snapshots_by_listing: dict[str, list[ListingSnapshot]],
    cutoff: datetime,
) -> float | None:
    baselines = []
    for listing in listings:
        snapshot = _snapshot_at_or_before(snapshots_by_listing.get(listing.id, []), cutoff)
        if snapshot is not None and snapshot.area_m2:
            baselines.append(snapshot.price / float(snapshot.area_m2))
    return median(baselines) if baselines else None


def _listing_baseline_supply(
    listings: list,
    snapshots_by_listing: dict[str, list[ListingSnapshot]],
    cutoff: datetime,
) -> int:
    return sum(
        int(
            any(
                snapshot.observed_at <= cutoff for snapshot in snapshots_by_listing.get(item.id, [])
            )
        )
        for item in listings
    )


def _snapshot_at_or_before(
    snapshots: list[ListingSnapshot], cutoff: datetime
) -> ListingSnapshot | None:
    eligible = [snapshot for snapshot in snapshots if snapshot.observed_at <= cutoff]
    return eligible[-1] if eligible else None


def _source_names(rows: list[TransactionObservation]) -> list[str]:
    names = []
    for row in rows:
        source = getattr(row, "source", None)
        name = getattr(source, "name", None) or "RCN transaction register"
        if name not in names:
            names.append(name)
    return names


def _removed_counts(session: Session, *, city: str, cutoff: datetime) -> dict[str, int]:
    rows = session.scalars(
        select(ListingEvent)
        .join(PropertySource, PropertySource.id == ListingEvent.property_source_id)
        .join(Property, Property.id == PropertySource.property_id)
        .join(ListingSource, ListingSource.id == PropertySource.source_id)
        .where(
            Property.city == city,
            ListingSource.is_demo.is_(False),
            ListingSource.is_active.is_(True),
            ListingSource.legal_status == "approved",
            ListingEvent.event_type == "removed",
            ListingEvent.observed_at >= cutoff,
        )
    ).all()
    counts: dict[str, int] = defaultdict(int)
    for event in rows:
        property_source = session.get(PropertySource, event.property_source_id)
        if property_source is None:
            continue
        property_row = session.get(Property, property_source.property_id)
        if property_row and property_row.area_id:
            counts[property_row.area_id] += 1
    return dict(counts)
