from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from domarion.db.base import Base


class ListingSource(Base):
    __tablename__ = "listing_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    base_url: Mapped[str | None] = mapped_column(String(255))
    source_type: Mapped[str] = mapped_column(String(40), default="portal")
    legal_status: Mapped[str] = mapped_column(String(40), default="unknown")
    refresh_cadence: Mapped[str] = mapped_column(String(80), default="manual")
    owner: Mapped[str] = mapped_column(String(120), default="internal")
    ingestion_method: Mapped[str] = mapped_column(String(80), default="manual")
    allowed_use_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    robots_txt_url: Mapped[str | None] = mapped_column(String(500))
    terms_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    source_type: Mapped[str] = mapped_column(String(60), index=True)
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    rows_seen: Mapped[int] = mapped_column(Integer, default=0)
    raw_created: Mapped[int] = mapped_column(Integer, default=0)
    raw_updated: Mapped[int] = mapped_column(Integer, default=0)
    properties_created: Mapped[int] = mapped_column(Integer, default=0)
    properties_updated: Mapped[int] = mapped_column(Integer, default=0)
    snapshots_created: Mapped[int] = mapped_column(Integer, default=0)
    snapshots_updated: Mapped[int] = mapped_column(Integer, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String(120), default="system", index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    job_id: Mapped[str | None] = mapped_column(ForeignKey("ingestion_jobs.id"), index=True)
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    source_listing_id: Mapped[str | None] = mapped_column(String(120), index=True)
    severity: Mapped[str] = mapped_column(String(40), index=True)
    code: Mapped[str] = mapped_column(String(80), index=True)
    message: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    job: Mapped[IngestionJob | None] = relationship()


class RawListing(Base):
    __tablename__ = "raw_listings"
    __table_args__ = (UniqueConstraint("source_id", "source_listing_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("listing_sources.id"))
    source_listing_id: Mapped[str] = mapped_column(String(120))
    source_url: Mapped[str] = mapped_column(String(500))
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    payload_hash: Mapped[str] = mapped_column(String(128))
    raw_payload: Mapped[dict] = mapped_column(JSONB)

    source: Mapped[ListingSource] = relationship()


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(primary_key=True)
    canonical_address: Mapped[str | None] = mapped_column(String(255))
    area_id: Mapped[str | None] = mapped_column(String(120), index=True)
    city: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str | None] = mapped_column(String(80), index=True)
    municipality: Mapped[str | None] = mapped_column(String(80), index=True)
    market_type: Mapped[str | None] = mapped_column(String(40))
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    area_m2: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    rooms: Mapped[int | None] = mapped_column(Integer)
    floor: Mapped[int | None] = mapped_column(Integer)
    building_floors: Mapped[int | None] = mapped_column(Integer)
    building_year: Mapped[int | None] = mapped_column(Integer)
    distance_to_center_km: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    nearest_stop_m: Mapped[int | None] = mapped_column(Integer)
    nearest_school_m: Mapped[int | None] = mapped_column(Integer)
    nearest_major_road_m: Mapped[int | None] = mapped_column(Integer)
    nearest_industrial_zone_m: Mapped[int | None] = mapped_column(Integer)
    parks_within_1km: Mapped[int | None] = mapped_column(Integer)
    schools_within_1km: Mapped[int | None] = mapped_column(Integer)
    planned_investments_within_2km: Mapped[int | None] = mapped_column(Integer)
    data_quality_score: Mapped[int] = mapped_column(Integer, default=50)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PropertySource(Base):
    __tablename__ = "property_sources"
    __table_args__ = (UniqueConstraint("property_id", "source_id", "source_listing_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"))
    source_id: Mapped[int] = mapped_column(ForeignKey("listing_sources.id"))
    source_listing_id: Mapped[str] = mapped_column(String(120))
    source_url: Mapped[str] = mapped_column(String(500))
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    active_status: Mapped[str] = mapped_column(String(40), default="active")

    property: Mapped[Property] = relationship()
    source: Mapped[ListingSource] = relationship()


class ListingSnapshot(Base):
    __tablename__ = "listing_snapshots"
    __table_args__ = (UniqueConstraint("property_source_id", "observed_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    property_source_id: Mapped[int] = mapped_column(ForeignKey("property_sources.id"))
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    price: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="PLN")
    area_m2: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    rooms: Mapped[int | None] = mapped_column(Integer)
    title: Mapped[str | None] = mapped_column(String(255))
    description_hash: Mapped[str | None] = mapped_column(String(128))
    normalized_payload: Mapped[dict] = mapped_column(JSONB)

    property_source: Mapped[PropertySource] = relationship()


class PropertyScore(Base):
    __tablename__ = "property_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"))
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    investment_score: Mapped[int] = mapped_column(Integer)
    risk_score: Mapped[int] = mapped_column(Integer)
    negotiation_score: Mapped[int] = mapped_column(Integer)
    liquidity_score: Mapped[int] = mapped_column(Integer)
    rental_potential_score: Mapped[int] = mapped_column(Integer)
    fair_price_low: Mapped[int | None] = mapped_column(Integer)
    fair_price_mid: Mapped[int | None] = mapped_column(Integer)
    fair_price_high: Mapped[int | None] = mapped_column(Integer)
    explanation_json: Mapped[dict] = mapped_column(JSONB)

    property: Mapped[Property] = relationship()


class PlannedInvestment(Base):
    __tablename__ = "planned_investments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    investment_type: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(60))
    city: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str | None] = mapped_column(String(80), index=True)
    expected_year: Mapped[int | None] = mapped_column(Integer)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    source_url: Mapped[str | None] = mapped_column(String(500))
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    notes: Mapped[str | None] = mapped_column(Text)


class AreaStatistic(Base):
    __tablename__ = "area_statistics"

    area_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(80), index=True)
    median_price_per_m2: Mapped[int] = mapped_column(Integer)
    average_price_per_m2: Mapped[int] = mapped_column(Integer)
    active_listings: Mapped[int] = mapped_column(Integer)
    new_listings_30d: Mapped[int] = mapped_column(Integer)
    removed_listings_30d: Mapped[int] = mapped_column(Integer)
    average_days_on_market: Mapped[int] = mapped_column(Integer)
    price_change_90d_pct: Mapped[float] = mapped_column(Float)
    supply_change_90d_pct: Mapped[float] = mapped_column(Float)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AreaMarketSnapshot(Base):
    __tablename__ = "area_market_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    area_id: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(80), index=True)
    median_price_per_m2: Mapped[int] = mapped_column(Integer)
    average_price_per_m2: Mapped[int] = mapped_column(Integer)
    active_listings: Mapped[int] = mapped_column(Integer)
    new_listings_30d: Mapped[int] = mapped_column(Integer)
    removed_listings_30d: Mapped[int] = mapped_column(Integer)
    average_days_on_market: Mapped[int] = mapped_column(Integer)
    price_change_90d_pct: Mapped[float] = mapped_column(Float)
    supply_change_90d_pct: Mapped[float] = mapped_column(Float)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True, default="demo-user")
    listing_id: Mapped[str] = mapped_column(String(120), index=True)
    audience: Mapped[str] = mapped_column(String(40), index=True)
    report_format: Mapped[str] = mapped_column(String(20), index=True)
    content_type: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    report_metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(40), default="buyer", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("user_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    plan: Mapped[str] = mapped_column(String(40), default="free", index=True)
    status: Mapped[str] = mapped_column(String(40), default="active", index=True)
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship()


class ReportOrder(Base):
    __tablename__ = "report_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    listing_id: Mapped[str] = mapped_column(String(120), index=True)
    product_code: Mapped[str] = mapped_column(String(60), index=True)
    audience: Mapped[str] = mapped_column(String(40), index=True)
    report_format: Mapped[str] = mapped_column(String(20), default="html")
    status: Mapped[str] = mapped_column(String(40), default="unpaid", index=True)
    amount_grosz: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="PLN")
    checkout_url: Mapped[str | None] = mapped_column(String(500))
    generated_report_id: Mapped[str | None] = mapped_column(String(36), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime)


class ReportOrderEvent(Base):
    __tablename__ = "report_order_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("report_orders.id"), index=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    actor_id: Mapped[str | None] = mapped_column(String(120), index=True)
    message: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    order: Mapped[ReportOrder] = relationship()


class PaymentWebhookEvent(Base):
    __tablename__ = "payment_webhook_events"
    __table_args__ = (UniqueConstraint("provider", "provider_event_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    provider: Mapped[str] = mapped_column(String(40), index=True)
    provider_event_id: Mapped[str] = mapped_column(String(160), index=True)
    order_id: Mapped[str | None] = mapped_column(String(36), index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    payload_hash: Mapped[str] = mapped_column(String(128), index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class UserFavorite(Base):
    __tablename__ = "user_favorites"
    __table_args__ = (UniqueConstraint("owner_id", "listing_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    listing_id: Mapped[str] = mapped_column(String(120), index=True)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class UserAlert(Base):
    __tablename__ = "user_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(160))
    channel: Mapped[str] = mapped_column(String(40), default="email")
    frequency: Mapped[str] = mapped_column(String(40), default="daily")
    delivery_target: Mapped[str | None] = mapped_column(String(255))
    filters: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AlertDeliveryJob(Base):
    __tablename__ = "alert_delivery_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    alert_id: Mapped[str] = mapped_column(ForeignKey("user_alerts.id"), index=True)
    channel: Mapped[str] = mapped_column(String(40), index=True)
    provider: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    total_matches: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str] = mapped_column(Text)
    listing_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    alert: Mapped[UserAlert] = relationship()
