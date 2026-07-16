from decimal import Decimal
from math import cos, radians

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from domarion.db.models import (
    Amenity,
    AreaStatistic,
    District,
    IndustrialZone,
    Kindergarten,
    ListingSnapshot,
    Municipality,
    School,
    TransportRoute,
    TransportStop,
)
from domarion.db.models import (
    ListingEvent as ListingEventRow,
)
from domarion.db.models import (
    LocationReference as LocationReferenceRow,
)
from domarion.db.models import (
    PlannedInvestment as PlannedInvestmentRow,
)
from domarion.repositories.base import BBox
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
from domarion.services.listing_text_search import normalize_search_tokens
from domarion.services.price_history import listing_with_price_history_metrics

_SEARCH_TRANSLATE_FROM = (
    "\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c"
    "\u0104\u0106\u0118\u0141\u0143\u00d3\u015a\u0179\u017b"
)
_SEARCH_TRANSLATE_TO = "acelnoszzACELNOSZZ"

_SNAPSHOT_SEARCH_TEXT_SQL = """
coalesce(snap.title, '') || ' ' ||
coalesce(snap.normalized_payload ->> 'id', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'title', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'source_name', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'source_url', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'voivodeship', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'city', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'district', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'municipality', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'area_id', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'address', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'market_type', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'building_type', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'renovation_state', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'parking_type', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'heating_type', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'rooms', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'floor', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'building_floors', '') || ' ' ||
coalesce(snap.normalized_payload ->> 'building_year', '')
"""

_PROPERTY_SEARCH_TEXT_SQL = """
coalesce(p.canonical_address, '') || ' ' ||
coalesce(p.area_id, '') || ' ' ||
coalesce(p.voivodeship, '') || ' ' ||
coalesce(p.city, '') || ' ' ||
coalesce(p.district, '') || ' ' ||
coalesce(p.municipality, '') || ' ' ||
coalesce(p.market_type, '') || ' ' ||
coalesce(p.building_type, '') || ' ' ||
coalesce(p.renovation_state, '') || ' ' ||
coalesce(p.parking_type, '') || ' ' ||
coalesce(p.heating_type, '') || ' ' ||
coalesce(p.rooms::text, '') || ' ' ||
coalesce(p.floor::text, '') || ' ' ||
coalesce(p.building_floors::text, '') || ' ' ||
coalesce(p.building_year::text, '')
"""


def _search_vector_sql(text_sql: str) -> str:
    return f"""
    to_tsvector(
        'simple',
        translate(
            lower({text_sql}),
            '{_SEARCH_TRANSLATE_FROM}',
            '{_SEARCH_TRANSLATE_TO}'
        )
    )
    """


def _search_query_sql() -> str:
    return f"""
    plainto_tsquery(
        'simple',
        translate(lower(:query), '{_SEARCH_TRANSLATE_FROM}', '{_SEARCH_TRANSLATE_TO}')
    )
    """


class PostgresRealEstateRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_listings(
        self,
        voivodeship: str | None = None,
        city: str | None = None,
        district: str | None = None,
        municipality: str | None = None,
        query: str | None = None,
        rooms: int | None = None,
        max_price: int | None = None,
        min_area_m2: float | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[Listing]:
        self._validate_spatial_args(lat=lat, lon=lon, radius_km=radius_km)
        candidate_listing_ids: set[str] | None = None
        if bbox is not None or radius_km is not None:
            spatial_listing_ids = set(
                self._listing_ids_matching_spatial_window(
                    bbox=bbox,
                    lat=lat,
                    lon=lon,
                    radius_km=radius_km,
                )
            )
            if not spatial_listing_ids:
                return []
            candidate_listing_ids = spatial_listing_ids

        if query:
            text_listing_ids = set(self._listing_ids_matching_text_query(query))
            if not text_listing_ids:
                return []
            candidate_listing_ids = (
                text_listing_ids
                if candidate_listing_ids is None
                else candidate_listing_ids & text_listing_ids
            )
            if not candidate_listing_ids:
                return []

        listings = self._latest_listings(candidate_listing_ids)

        if voivodeship:
            voivodeship_key = voivodeship.casefold()
            listings = [
                item
                for item in listings
                if item.voivodeship is not None and item.voivodeship.casefold() == voivodeship_key
            ]
        if city:
            listings = [item for item in listings if item.city.lower() == city.lower()]
        if district:
            listings = [item for item in listings if item.district.lower() == district.lower()]
        if municipality:
            municipality_key = municipality.casefold()
            listings = [
                item for item in listings if item.municipality.casefold() == municipality_key
            ]
        if rooms:
            listings = [item for item in listings if item.rooms == rooms]
        if max_price:
            listings = [item for item in listings if item.price <= max_price]
        if min_area_m2:
            listings = [item for item in listings if item.area_m2 >= min_area_m2]

        return listings

    def get_listing(self, listing_id: str) -> Listing | None:
        for listing in self._latest_listings():
            if listing.id == listing_id:
                return listing
        return None

    def list_area_statistics(self) -> list[AreaStatistics]:
        rows = self.session.scalars(select(AreaStatistic).order_by(AreaStatistic.city)).all()
        return [self._area_to_schema(row) for row in rows]

    def get_area_statistics(self, area_id: str) -> AreaStatistics | None:
        row = self.session.get(AreaStatistic, area_id)
        if row is None:
            return None
        return self._area_to_schema(row)

    def list_developer_reputations(
        self,
        city: str | None = None,
    ) -> list[DeveloperReputation]:
        return []

    def get_developer_reputation(self, developer_id: str) -> DeveloperReputation | None:
        return None

    def get_developer_reputation_for_listing(
        self,
        listing_id: str,
    ) -> DeveloperReputation | None:
        return None

    def list_municipalities(self) -> list[MunicipalityReference]:
        rows = self.session.scalars(select(Municipality).order_by(Municipality.name)).all()
        return [self._municipality_to_schema(row) for row in rows]

    def list_district_references(
        self,
        municipality_id: str | None = None,
        city: str | None = None,
    ) -> list[DistrictReference]:
        statement = select(District).join(Municipality).order_by(Municipality.name, District.name)
        if municipality_id:
            statement = statement.where(District.municipality_id == municipality_id)
        if city:
            statement = statement.where(Municipality.name.ilike(city))

        rows = self.session.scalars(statement).all()
        return [self._district_to_schema(row) for row in rows]

    def list_location_references(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        location_type: LocationReferenceType | None = None,
        query: str | None = None,
        limit: int = 100,
    ) -> list[LocationReference]:
        statement = select(LocationReferenceRow).join(Municipality).order_by(
            Municipality.name,
            LocationReferenceRow.name,
        )
        if municipality_id:
            statement = statement.where(LocationReferenceRow.municipality_id == municipality_id)
        if district_id:
            statement = statement.where(LocationReferenceRow.district_id == district_id)
        if location_type:
            statement = statement.where(LocationReferenceRow.location_type == location_type)
        if query:
            search = f"%{query}%"
            statement = statement.where(
                LocationReferenceRow.name.ilike(search)
                | LocationReferenceRow.slug.ilike(search)
            )

        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._location_reference_to_schema(row) for row in rows]

    def list_transport_stops(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportStopReference]:
        statement = self._infrastructure_statement(
            TransportStop,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=TransportStop.name,
        )
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._transport_stop_to_schema(row) for row in rows]

    def list_transport_routes(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[TransportRouteReference]:
        statement = self._infrastructure_statement(
            TransportRoute,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=TransportRoute.route_name,
        )
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._transport_route_to_schema(row) for row in rows]

    def list_schools(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[SchoolReference]:
        statement = self._infrastructure_statement(
            School,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=School.name,
        )
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._school_to_schema(row) for row in rows]

    def list_kindergartens(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[KindergartenReference]:
        statement = self._infrastructure_statement(
            Kindergarten,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=Kindergarten.name,
        )
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._kindergarten_to_schema(row) for row in rows]

    def list_amenities(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        amenity_type: str | None = None,
        limit: int = 100,
    ) -> list[AmenityReference]:
        statement = self._infrastructure_statement(
            Amenity,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=Amenity.name,
        )
        if amenity_type:
            statement = statement.where(Amenity.amenity_type == amenity_type)
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._amenity_to_schema(row) for row in rows]

    def list_industrial_zones(
        self,
        municipality_id: str | None = None,
        district_id: str | None = None,
        city: str | None = None,
        limit: int = 100,
    ) -> list[IndustrialZoneReference]:
        statement = self._infrastructure_statement(
            IndustrialZone,
            municipality_id=municipality_id,
            district_id=district_id,
            city=city,
            order_column=IndustrialZone.name,
        )
        rows = self.session.scalars(statement.limit(limit)).all()
        return [self._industrial_zone_to_schema(row) for row in rows]

    def list_planned_investments(
        self,
        city: str | None = None,
        district: str | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[PlannedInvestment]:
        self._validate_spatial_args(lat=lat, lon=lon, radius_km=radius_km)
        spatial_investment_ids = None
        if bbox is not None or radius_km is not None:
            spatial_investment_ids = self._planned_investment_ids_matching_spatial_window(
                city=city,
                district=district,
                bbox=bbox,
                lat=lat,
                lon=lon,
                radius_km=radius_km,
            )
            if not spatial_investment_ids:
                return []

        statement = select(PlannedInvestmentRow).where(
            PlannedInvestmentRow.lat.is_not(None),
            PlannedInvestmentRow.lon.is_not(None),
        )
        if city:
            statement = statement.where(PlannedInvestmentRow.city.ilike(city))
        if district:
            statement = statement.where(PlannedInvestmentRow.district.ilike(district))
        if spatial_investment_ids is not None:
            statement = statement.where(PlannedInvestmentRow.id.in_(spatial_investment_ids))

        rows = self.session.scalars(statement.order_by(PlannedInvestmentRow.name)).all()
        if spatial_investment_ids is not None:
            sort_order = {row_id: index for index, row_id in enumerate(spatial_investment_ids)}
            rows = sorted(rows, key=lambda row: sort_order[row.id])
        return [self._planned_investment_to_schema(row) for row in rows]

    def get_planned_investment(self, investment_id: str) -> PlannedInvestment | None:
        row_id = self._parse_planned_investment_id(investment_id)
        if row_id is None:
            return None
        row = self.session.get(PlannedInvestmentRow, row_id)
        if row is None:
            return None
        return self._planned_investment_to_schema(row)

    def create_planned_investment(
        self,
        payload: PlannedInvestmentCreate,
    ) -> PlannedInvestment:
        row = PlannedInvestmentRow()
        self._apply_planned_investment_payload(row, payload.model_dump(exclude_unset=True))
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._planned_investment_to_schema(row)

    def update_planned_investment(
        self,
        investment_id: str,
        payload: PlannedInvestmentUpdate,
    ) -> PlannedInvestment | None:
        row_id = self._parse_planned_investment_id(investment_id)
        if row_id is None:
            return None
        row = self.session.get(PlannedInvestmentRow, row_id)
        if row is None:
            return None
        self._apply_planned_investment_payload(row, payload.model_dump(exclude_unset=True))
        self.session.commit()
        self.session.refresh(row)
        return self._planned_investment_to_schema(row)

    def delete_planned_investment(self, investment_id: str) -> bool:
        row_id = self._parse_planned_investment_id(investment_id)
        if row_id is None:
            return False
        row = self.session.get(PlannedInvestmentRow, row_id)
        if row is None:
            return False
        self.session.delete(row)
        self.session.commit()
        return True

    def get_price_history(self, listing_id: str) -> list[PriceHistoryPoint]:
        snapshots = self.session.scalars(
            select(ListingSnapshot).order_by(ListingSnapshot.observed_at)
        ).all()

        history = []
        for snapshot in snapshots:
            payload = snapshot.normalized_payload
            if payload.get("id") != listing_id:
                continue

            history.append(self._snapshot_to_price_history_point(snapshot))

        return history

    def get_listing_events(self, listing_id: str) -> list[ListingEvent]:
        rows = self.session.scalars(
            select(ListingEventRow)
            .where(ListingEventRow.listing_id == listing_id)
            .order_by(ListingEventRow.observed_at, ListingEventRow.id)
        ).all()
        return [
            ListingEvent(
                listing_id=row.listing_id,
                event_type=row.event_type,
                observed_at=row.observed_at.date(),
                summary=row.summary,
                payload=row.event_payload,
            )
            for row in rows
        ]

    def find_comparables(self, listing: Listing, limit: int = 5) -> list[Listing]:
        candidates = [
            candidate
            for candidate in self._latest_listings()
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

    def _listing_ids_matching_spatial_window(
        self,
        *,
        bbox: BBox | None,
        lat: float | None,
        lon: float | None,
        radius_km: float | None,
    ) -> list[str]:
        clauses, params = self._spatial_window_clauses(
            "p",
            bbox=bbox,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
        )
        where_sql = " and ".join(["p.geom is not null", "snap.normalized_payload ? 'id'", *clauses])
        distance_sql = self._distance_sql("p") if lat is not None and lon is not None else "NULL"
        rows = self.session.execute(
            text(
                f"""
                with latest as (
                    select distinct on (snap.normalized_payload ->> 'id')
                        snap.normalized_payload ->> 'id' as listing_id,
                        {distance_sql} as distance_m
                    from listing_snapshots snap
                    join property_sources ps on ps.id = snap.property_source_id
                    join properties p on p.id = ps.property_id
                    where {where_sql}
                    order by snap.normalized_payload ->> 'id', snap.observed_at desc
                )
                select listing_id
                from latest
                order by distance_m nulls last, listing_id
                """
            ),
            params,
        ).all()
        return [row.listing_id for row in rows]

    def _listing_ids_matching_text_query(self, query: str) -> list[str]:
        tokens = normalize_search_tokens(query)
        if not tokens:
            return []

        snapshot_search_vector = _search_vector_sql(_SNAPSHOT_SEARCH_TEXT_SQL)
        property_search_vector = _search_vector_sql(_PROPERTY_SEARCH_TEXT_SQL)
        query_terms = _search_query_sql()
        rows = self.session.execute(
            text(
                f"""
                with query_terms as (
                    select {query_terms} as terms
                ),
                matching as (
                    select distinct on (snap.normalized_payload ->> 'id')
                        snap.normalized_payload ->> 'id' as listing_id
                    from listing_snapshots snap
                    join property_sources ps on ps.id = snap.property_source_id
                    join properties p on p.id = ps.property_id
                    cross join query_terms terms
                    where snap.normalized_payload ? 'id'
                      and (
                        {snapshot_search_vector} @@ terms.terms
                        or {property_search_vector} @@ terms.terms
                      )
                    order by snap.normalized_payload ->> 'id', snap.observed_at desc
                )
                select listing_id
                from matching
                order by listing_id
                """
            ),
            {"query": " ".join(tokens)},
        ).all()
        return [row.listing_id for row in rows]

    def _planned_investment_ids_matching_spatial_window(
        self,
        *,
        city: str | None,
        district: str | None,
        bbox: BBox | None,
        lat: float | None,
        lon: float | None,
        radius_km: float | None,
    ) -> list[int]:
        clauses, params = self._spatial_window_clauses(
            "pi",
            bbox=bbox,
            lat=lat,
            lon=lon,
            radius_km=radius_km,
        )
        if city:
            clauses.append("pi.city ilike :city")
            params["city"] = city
        if district:
            clauses.append("pi.district ilike :district")
            params["district"] = district

        where_sql = " and ".join(["pi.geom is not null", *clauses])
        distance_sql = self._distance_sql("pi") if lat is not None and lon is not None else "NULL"
        rows = self.session.execute(
            text(
                f"""
                select pi.id, {distance_sql} as distance_m
                from planned_investments pi
                where {where_sql}
                order by distance_m nulls last, pi.name
                """
            ),
            params,
        ).all()
        return [row.id for row in rows]

    @staticmethod
    def _spatial_window_clauses(
        table_alias: str,
        *,
        bbox: BBox | None,
        lat: float | None,
        lon: float | None,
        radius_km: float | None,
    ) -> tuple[list[str], dict[str, object]]:
        clauses: list[str] = []
        params: dict[str, object] = {}

        if bbox is not None:
            min_lon, min_lat, max_lon, max_lat = bbox
            params.update(
                {
                    "min_lon": min_lon,
                    "min_lat": min_lat,
                    "max_lon": max_lon,
                    "max_lat": max_lat,
                }
            )
            envelope = "ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)"
            clauses.append(f"{table_alias}.geom && {envelope}")
            clauses.append(f"ST_Intersects({table_alias}.geom, {envelope})")

        if radius_km is not None:
            if lat is None or lon is None:
                raise ValueError("radius_km requires lat and lon")
            radius_m = radius_km * 1000
            params.update(
                {
                    "center_lat": lat,
                    "center_lon": lon,
                    "radius_m": radius_m,
                    "radius_degrees": _radius_degrees(radius_km, lat),
                }
            )
            center_geom = "ST_SetSRID(ST_MakePoint(:center_lon, :center_lat), 4326)"
            clauses.append(f"ST_DWithin({table_alias}.geom, {center_geom}, :radius_degrees)")
            clauses.append(
                f"ST_DWithin({table_alias}.geom::geography, {center_geom}::geography, :radius_m)"
            )

        return clauses, params

    @staticmethod
    def _distance_sql(table_alias: str) -> str:
        center_geom = "ST_SetSRID(ST_MakePoint(:center_lon, :center_lat), 4326)"
        return f"ST_Distance({table_alias}.geom::geography, {center_geom}::geography)"

    def _latest_listings(self, listing_ids: set[str] | None = None) -> list[Listing]:
        if listing_ids is not None and not listing_ids:
            return []

        statement = select(ListingSnapshot).order_by(ListingSnapshot.observed_at)
        if listing_ids is not None:
            statement = statement.where(
                ListingSnapshot.normalized_payload["id"].as_string().in_(sorted(listing_ids))
            )
        snapshots = self.session.scalars(statement).all()

        snapshots_by_listing_id: dict[str, list[ListingSnapshot]] = {}
        for snapshot in snapshots:
            listing_id = snapshot.normalized_payload.get("id")
            if listing_id is None:
                continue
            snapshots_by_listing_id.setdefault(listing_id, []).append(snapshot)

        listings = []
        for listing_snapshots in snapshots_by_listing_id.values():
            latest_snapshot = listing_snapshots[-1]
            listing = Listing.model_validate(latest_snapshot.normalized_payload)
            history = [
                self._snapshot_to_price_history_point(snapshot)
                for snapshot in listing_snapshots
            ]
            listings.append(listing_with_price_history_metrics(listing, history))

        return sorted(listings, key=lambda listing: listing.last_seen_at, reverse=True)

    def _infrastructure_statement(
        self,
        row_model,
        *,
        municipality_id: str | None,
        district_id: str | None,
        city: str | None,
        order_column,
    ):
        statement = select(row_model).join(Municipality).order_by(Municipality.name, order_column)
        if municipality_id:
            statement = statement.where(row_model.municipality_id == municipality_id)
        if district_id:
            statement = statement.where(row_model.district_id == district_id)
        if city:
            statement = statement.where(Municipality.name.ilike(city))
        return statement

    @staticmethod
    def _area_to_schema(row: AreaStatistic) -> AreaStatistics:
        return AreaStatistics(
            area_id=row.area_id,
            name=row.name,
            city=row.city,
            median_price_per_m2=row.median_price_per_m2,
            average_price_per_m2=row.average_price_per_m2,
            active_listings=row.active_listings,
            new_listings_30d=row.new_listings_30d,
            removed_listings_30d=row.removed_listings_30d,
            average_days_on_market=row.average_days_on_market,
            price_change_90d_pct=row.price_change_90d_pct,
            supply_change_90d_pct=row.supply_change_90d_pct,
        )

    @staticmethod
    def _municipality_to_schema(row: Municipality) -> MunicipalityReference:
        return MunicipalityReference(
            id=row.id,
            name=row.name,
            country_code=row.country_code,
            region=row.region,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            metadata=row.metadata_json,
        )

    @staticmethod
    def _district_to_schema(row: District) -> DistrictReference:
        return DistrictReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            name=row.name,
            slug=row.slug,
            area_id=row.area_id,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            metadata=row.metadata_json,
        )

    @staticmethod
    def _location_reference_to_schema(row: LocationReferenceRow) -> LocationReference:
        return LocationReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            slug=row.slug,
            location_type=row.location_type,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            aliases=row.aliases_json,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _transport_stop_to_schema(row: TransportStop) -> TransportStopReference:
        return TransportStopReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            stop_type=row.stop_type,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            lines=row.lines_json,
            source_url=row.source_url,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _transport_route_to_schema(row: TransportRoute) -> TransportRouteReference:
        return TransportRouteReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            route_number=row.route_number,
            route_name=row.route_name,
            route_type=row.route_type,
            operator=row.operator,
            status=row.status,
            stop_ids=row.stop_ids_json,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _school_to_schema(row: School) -> SchoolReference:
        return SchoolReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            school_type=row.school_type,
            operator_type=row.operator_type,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            source_url=row.source_url,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _kindergarten_to_schema(row: Kindergarten) -> KindergartenReference:
        return KindergartenReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            kindergarten_type=row.kindergarten_type,
            operator_type=row.operator_type,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            source_url=row.source_url,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _amenity_to_schema(row: Amenity) -> AmenityReference:
        return AmenityReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            amenity_type=row.amenity_type,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            source_url=row.source_url,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _industrial_zone_to_schema(row: IndustrialZone) -> IndustrialZoneReference:
        return IndustrialZoneReference(
            id=row.id,
            municipality_id=row.municipality_id,
            municipality_name=row.municipality.name,
            district_id=row.district_id,
            district_name=row.district.name if row.district else None,
            name=row.name,
            zone_type=row.zone_type,
            risk_level=row.risk_level,
            impact_radius_m=row.impact_radius_m,
            lat=_optional_decimal_float(row.lat),
            lon=_optional_decimal_float(row.lon),
            source_url=row.source_url,
            metadata=row.metadata_json,
        )

    @staticmethod
    def _planned_investment_to_schema(row: PlannedInvestmentRow) -> PlannedInvestment:
        if row.lat is None or row.lon is None:
            raise ValueError(f"Planned investment {row.id} has no coordinates")

        return PlannedInvestment(
            id=f"planned-{row.id}",
            name=row.name,
            investment_type=row.investment_type,
            status=row.status,
            city=row.city,
            district=row.district,
            expected_year=row.expected_year,
            lat=float(row.lat),
            lon=float(row.lon),
            source_url=row.source_url,
            confidence_score=row.confidence_score,
            notes=row.notes,
        )

    @staticmethod
    def _parse_planned_investment_id(investment_id: str) -> int | None:
        raw_id = investment_id.removeprefix("planned-")
        if not raw_id.isdigit():
            return None
        return int(raw_id)

    @staticmethod
    def _validate_spatial_args(
        *,
        lat: float | None,
        lon: float | None,
        radius_km: float | None,
    ) -> None:
        if radius_km is not None and (lat is None or lon is None):
            raise ValueError("radius_km requires lat and lon")

    @staticmethod
    def _apply_planned_investment_payload(
        row: PlannedInvestmentRow,
        payload: dict,
    ) -> None:
        for key, value in payload.items():
            if key in {"lat", "lon"} and value is not None:
                setattr(row, key, Decimal(str(value)))
            else:
                setattr(row, key, value)

    @staticmethod
    def _snapshot_to_price_history_point(snapshot: ListingSnapshot) -> PriceHistoryPoint:
        payload = snapshot.normalized_payload
        area_m2 = float(snapshot.area_m2 or payload["area_m2"])
        return PriceHistoryPoint(
            observed_at=snapshot.observed_at.date(),
            price=snapshot.price,
            price_per_m2=int(round(snapshot.price / area_m2)),
        )


def _optional_decimal_float(value: Decimal | None) -> float | None:
    if value is None:
        return None
    return float(value)


def _radius_degrees(radius_km: float, lat: float) -> float:
    latitude_degrees = radius_km / 111.32
    longitude_scale = 111.32 * max(cos(radians(abs(lat))), 0.2)
    longitude_degrees = radius_km / longitude_scale
    return max(latitude_degrees, longitude_degrees)
