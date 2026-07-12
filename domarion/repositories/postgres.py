from decimal import Decimal
from math import cos, radians

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from domarion.db.models import (
    AreaStatistic,
    ListingSnapshot,
)
from domarion.db.models import (
    PlannedInvestment as PlannedInvestmentRow,
)
from domarion.repositories.base import BBox
from domarion.schemas import (
    AreaStatistics,
    Listing,
    PlannedInvestment,
    PlannedInvestmentCreate,
    PlannedInvestmentUpdate,
    PriceHistoryPoint,
)
from domarion.services.price_history import listing_with_price_history_metrics


class PostgresRealEstateRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_listings(
        self,
        city: str | None = None,
        district: str | None = None,
        rooms: int | None = None,
        max_price: int | None = None,
        min_area_m2: float | None = None,
        bbox: BBox | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
    ) -> list[Listing]:
        self._validate_spatial_args(lat=lat, lon=lon, radius_km=radius_km)
        spatial_listing_ids = None
        if bbox is not None or radius_km is not None:
            spatial_listing_ids = self._listing_ids_matching_spatial_window(
                bbox=bbox,
                lat=lat,
                lon=lon,
                radius_km=radius_km,
            )
            if not spatial_listing_ids:
                return []

        listings = self._latest_listings()
        if spatial_listing_ids is not None:
            allowed_ids = set(spatial_listing_ids)
            listings = [item for item in listings if item.id in allowed_ids]

        if city:
            listings = [item for item in listings if item.city.lower() == city.lower()]
        if district:
            listings = [item for item in listings if item.district.lower() == district.lower()]
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

    def _latest_listings(self) -> list[Listing]:
        snapshots = self.session.scalars(
            select(ListingSnapshot).order_by(ListingSnapshot.observed_at)
        ).all()

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


def _radius_degrees(radius_km: float, lat: float) -> float:
    latitude_degrees = radius_km / 111.32
    longitude_scale = 111.32 * max(cos(radians(abs(lat))), 0.2)
    longitude_degrees = radius_km / longitude_scale
    return max(latitude_degrees, longitude_degrees)
