from datetime import datetime, time
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import (
    AreaStatistic,
    ListingSnapshot,
    ListingSource,
    Property,
    PropertySource,
)
from domarion.db.models import (
    PlannedInvestment as PlannedInvestmentRow,
)
from domarion.db.session import SessionLocal
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import Listing, PlannedInvestment, PriceHistoryPoint


def seed_demo_data() -> dict[str, int]:
    with SessionLocal() as session:
        return seed_demo_data_in_session(session)


def seed_demo_data_in_session(session: Session) -> dict[str, int]:
    demo_repository = InMemoryRealEstateRepository()
    source = _get_or_create_demo_source(session)

    areas_seeded = 0
    listings_seeded = 0
    planned_investments_seeded = 0
    snapshots_seeded = 0

    for area in demo_repository.list_area_statistics():
        session.merge(
            AreaStatistic(
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
            )
        )
        areas_seeded += 1

    for listing in demo_repository.list_listings():
        property_source, created = _get_or_create_property_source(session, source, listing)
        listings_seeded += int(created)

        for history_point in demo_repository.get_price_history(listing.id):
            if _snapshot_exists(session, property_source, history_point):
                continue
            session.add(_build_snapshot(property_source, listing, history_point))
            snapshots_seeded += 1

    for investment in demo_repository.list_planned_investments():
        planned_investments_seeded += int(_upsert_planned_investment(session, investment))

    session.commit()
    return {
        "areas_seeded": areas_seeded,
        "listings_seeded": listings_seeded,
        "planned_investments_seeded": planned_investments_seeded,
        "snapshots_seeded": snapshots_seeded,
    }


def _get_or_create_demo_source(session: Session) -> ListingSource:
    source = session.scalar(
        select(ListingSource).where(ListingSource.name == "Demo seed")
    )
    if source is not None:
        return source

    source = ListingSource(
        name="Demo seed",
        base_url="https://example.com",
        source_type="seed",
    )
    session.add(source)
    session.flush()
    return source


def _get_or_create_property_source(
    session: Session,
    source: ListingSource,
    listing: Listing,
) -> tuple[PropertySource, bool]:
    property_source = session.scalar(
        select(PropertySource).where(
            PropertySource.source_id == source.id,
            PropertySource.source_listing_id == listing.id,
        )
    )
    if property_source is not None:
        property_source.last_seen_at = datetime.combine(listing.last_seen_at, time.min)
        return property_source, False

    property_ = Property(
        canonical_address=listing.address,
        area_id=listing.area_id,
        city=listing.city,
        district=listing.district,
        municipality=listing.municipality,
        market_type=listing.market_type,
        lat=Decimal(str(listing.lat)),
        lon=Decimal(str(listing.lon)),
        area_m2=Decimal(str(listing.area_m2)),
        rooms=listing.rooms,
        floor=listing.floor,
        building_floors=listing.building_floors,
        building_year=listing.building_year,
        distance_to_center_km=Decimal(str(listing.distance_to_center_km)),
        nearest_stop_m=listing.nearest_stop_m,
        nearest_school_m=listing.nearest_school_m,
        nearest_major_road_m=listing.nearest_major_road_m,
        nearest_industrial_zone_m=listing.nearest_industrial_zone_m,
        parks_within_1km=listing.parks_within_1km,
        schools_within_1km=listing.schools_within_1km,
        planned_investments_within_2km=listing.planned_investments_within_2km,
        data_quality_score=listing.data_quality_score,
    )
    session.add(property_)
    session.flush()

    property_source = PropertySource(
        property_id=property_.id,
        source_id=source.id,
        source_listing_id=listing.id,
        source_url=listing.source_url,
        first_seen_at=datetime.combine(listing.first_seen_at, time.min),
        last_seen_at=datetime.combine(listing.last_seen_at, time.min),
        active_status="active",
    )
    session.add(property_source)
    session.flush()
    return property_source, True


def _snapshot_exists(
    session: Session,
    property_source: PropertySource,
    history_point: PriceHistoryPoint,
) -> bool:
    observed_at = datetime.combine(history_point.observed_at, time.min)
    snapshot = session.scalar(
        select(ListingSnapshot).where(
            ListingSnapshot.property_source_id == property_source.id,
            ListingSnapshot.observed_at == observed_at,
        )
    )
    return snapshot is not None


def _build_snapshot(
    property_source: PropertySource,
    listing: Listing,
    history_point: PriceHistoryPoint,
) -> ListingSnapshot:
    observed_at = datetime.combine(history_point.observed_at, time.min)
    payload = listing.model_copy(
        update={
            "price": history_point.price,
            "price_per_m2": history_point.price_per_m2,
        }
    ).model_dump(mode="json")

    return ListingSnapshot(
        property_source_id=property_source.id,
        observed_at=observed_at,
        price=history_point.price,
        currency=listing.currency,
        area_m2=Decimal(str(listing.area_m2)),
        rooms=listing.rooms,
        title=listing.title,
        description_hash=None,
        normalized_payload=payload,
    )


def _upsert_planned_investment(session: Session, investment: PlannedInvestment) -> bool:
    row = session.scalar(
        select(PlannedInvestmentRow).where(
            PlannedInvestmentRow.name == investment.name,
            PlannedInvestmentRow.city == investment.city,
        )
    )
    created = row is None
    if row is None:
        row = PlannedInvestmentRow(name=investment.name, city=investment.city)
        session.add(row)

    row.investment_type = investment.investment_type
    row.status = investment.status
    row.district = investment.district
    row.expected_year = investment.expected_year
    row.lat = Decimal(str(investment.lat))
    row.lon = Decimal(str(investment.lon))
    row.source_url = investment.source_url
    row.confidence_score = investment.confidence_score
    row.notes = investment.notes
    return created
