from datetime import datetime, time
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from domarion.db.models import (
    Amenity,
    AreaStatistic,
    District,
    IndustrialZone,
    Kindergarten,
    ListingSnapshot,
    ListingSource,
    Municipality,
    Property,
    PropertySource,
    School,
    TransportRoute,
    TransportStop,
)
from domarion.db.models import (
    LocationReference as LocationReferenceRow,
)
from domarion.db.models import (
    PlannedInvestment as PlannedInvestmentRow,
)
from domarion.db.session import SessionLocal
from domarion.ingestion.db_writer import rebuild_price_history_metrics_in_session
from domarion.repositories.in_memory import InMemoryRealEstateRepository
from domarion.schemas import (
    AmenityReference,
    DistrictReference,
    IndustrialZoneReference,
    KindergartenReference,
    Listing,
    LocationReference,
    MunicipalityReference,
    PlannedInvestment,
    PriceHistoryPoint,
    SchoolReference,
    TransportRouteReference,
    TransportStopReference,
)


def seed_demo_data() -> dict[str, int]:
    with SessionLocal() as session:
        return seed_demo_data_in_session(session)


def seed_demo_data_in_session(session: Session) -> dict[str, int]:
    demo_repository = InMemoryRealEstateRepository()
    source = _get_or_create_demo_source(session)

    areas_seeded = 0
    municipalities_seeded = 0
    districts_seeded = 0
    locations_seeded = 0
    transport_stops_seeded = 0
    transport_routes_seeded = 0
    schools_seeded = 0
    kindergartens_seeded = 0
    amenities_seeded = 0
    industrial_zones_seeded = 0
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

    for municipality in demo_repository.list_municipalities():
        municipalities_seeded += int(_upsert_municipality(session, municipality))

    for district in demo_repository.list_district_references():
        districts_seeded += int(_upsert_district(session, district))

    for location in demo_repository.list_location_references():
        locations_seeded += int(_upsert_location_reference(session, location))

    for stop in demo_repository.list_transport_stops():
        transport_stops_seeded += int(_upsert_transport_stop(session, stop))

    for route in demo_repository.list_transport_routes():
        transport_routes_seeded += int(_upsert_transport_route(session, route))

    for school in demo_repository.list_schools():
        schools_seeded += int(_upsert_school(session, school))

    for kindergarten in demo_repository.list_kindergartens():
        kindergartens_seeded += int(_upsert_kindergarten(session, kindergarten))

    for amenity in demo_repository.list_amenities():
        amenities_seeded += int(_upsert_amenity(session, amenity))

    for zone in demo_repository.list_industrial_zones():
        industrial_zones_seeded += int(_upsert_industrial_zone(session, zone))

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

    history_result = rebuild_price_history_metrics_in_session(session)
    session.commit()
    return {
        "areas_seeded": areas_seeded,
        "municipalities_seeded": municipalities_seeded,
        "districts_seeded": districts_seeded,
        "locations_seeded": locations_seeded,
        "transport_stops_seeded": transport_stops_seeded,
        "transport_routes_seeded": transport_routes_seeded,
        "schools_seeded": schools_seeded,
        "kindergartens_seeded": kindergartens_seeded,
        "amenities_seeded": amenities_seeded,
        "industrial_zones_seeded": industrial_zones_seeded,
        "listings_seeded": listings_seeded,
        "planned_investments_seeded": planned_investments_seeded,
        "snapshots_seeded": snapshots_seeded,
        "listing_events_seeded": history_result.listing_events_created,
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


def _upsert_municipality(session: Session, item: MunicipalityReference) -> bool:
    row = session.get(Municipality, item.id)
    created = row is None
    if row is None:
        row = Municipality(id=item.id)
        session.add(row)

    row.name = item.name
    row.country_code = item.country_code
    row.region = item.region
    row.lat = _optional_decimal(item.lat)
    row.lon = _optional_decimal(item.lon)
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()
    session.flush()
    return created


def _upsert_district(session: Session, item: DistrictReference) -> bool:
    row = session.get(District, item.id)
    created = row is None
    if row is None:
        row = District(id=item.id)
        session.add(row)

    row.municipality_id = item.municipality_id
    row.area_id = item.area_id
    row.name = item.name
    row.slug = item.slug
    row.lat = _optional_decimal(item.lat)
    row.lon = _optional_decimal(item.lon)
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()
    session.flush()
    return created


def _upsert_location_reference(session: Session, item: LocationReference) -> bool:
    row = session.get(LocationReferenceRow, item.id)
    created = row is None
    if row is None:
        row = LocationReferenceRow(id=item.id)
        session.add(row)

    row.municipality_id = item.municipality_id
    row.district_id = item.district_id
    row.name = item.name
    row.slug = item.slug
    row.location_type = item.location_type
    row.lat = _optional_decimal(item.lat)
    row.lon = _optional_decimal(item.lon)
    row.aliases_json = item.aliases
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()
    session.flush()
    return created


def _upsert_transport_stop(session: Session, item: TransportStopReference) -> bool:
    row = session.get(TransportStop, item.id)
    created = row is None
    if row is None:
        row = TransportStop(id=item.id)
        session.add(row)

    _apply_point_reference(row, item)
    row.stop_type = item.stop_type
    row.lines_json = item.lines
    session.flush()
    return created


def _upsert_transport_route(session: Session, item: TransportRouteReference) -> bool:
    row = session.get(TransportRoute, item.id)
    created = row is None
    if row is None:
        row = TransportRoute(id=item.id)
        session.add(row)

    row.municipality_id = item.municipality_id
    row.district_id = item.district_id
    row.route_number = item.route_number
    row.route_name = item.route_name
    row.route_type = item.route_type
    row.operator = item.operator
    row.status = item.status
    row.stop_ids_json = item.stop_ids
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()
    session.flush()
    return created


def _upsert_school(session: Session, item: SchoolReference) -> bool:
    row = session.get(School, item.id)
    created = row is None
    if row is None:
        row = School(id=item.id)
        session.add(row)

    _apply_point_reference(row, item)
    row.school_type = item.school_type
    row.operator_type = item.operator_type
    session.flush()
    return created


def _upsert_kindergarten(session: Session, item: KindergartenReference) -> bool:
    row = session.get(Kindergarten, item.id)
    created = row is None
    if row is None:
        row = Kindergarten(id=item.id)
        session.add(row)

    _apply_point_reference(row, item)
    row.kindergarten_type = item.kindergarten_type
    row.operator_type = item.operator_type
    session.flush()
    return created


def _upsert_amenity(session: Session, item: AmenityReference) -> bool:
    row = session.get(Amenity, item.id)
    created = row is None
    if row is None:
        row = Amenity(id=item.id)
        session.add(row)

    _apply_point_reference(row, item)
    row.amenity_type = item.amenity_type
    session.flush()
    return created


def _upsert_industrial_zone(session: Session, item: IndustrialZoneReference) -> bool:
    row = session.get(IndustrialZone, item.id)
    created = row is None
    if row is None:
        row = IndustrialZone(id=item.id)
        session.add(row)

    _apply_point_reference(row, item)
    row.zone_type = item.zone_type
    row.risk_level = item.risk_level
    row.impact_radius_m = item.impact_radius_m
    session.flush()
    return created


def _apply_point_reference(row, item) -> None:
    row.municipality_id = item.municipality_id
    row.district_id = item.district_id
    row.name = item.name
    row.lat = _optional_decimal(item.lat)
    row.lon = _optional_decimal(item.lon)
    row.source_url = item.source_url
    row.metadata_json = item.metadata
    row.updated_at = datetime.utcnow()


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
        voivodeship=listing.voivodeship,
        city=listing.city,
        district=listing.district,
        municipality=listing.municipality,
        market_type=listing.market_type,
        building_type=listing.building_type,
        renovation_state=listing.renovation_state,
        has_balcony=listing.has_balcony,
        has_terrace=listing.has_terrace,
        has_garden=listing.has_garden,
        has_elevator=listing.has_elevator,
        parking_type=listing.parking_type,
        heating_type=listing.heating_type,
        developer_id=listing.developer_id,
        developer_name=listing.developer_name,
        investment_name=listing.investment_name,
        primary_market_project_id=listing.primary_market_project_id,
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


def _optional_decimal(value: float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))
