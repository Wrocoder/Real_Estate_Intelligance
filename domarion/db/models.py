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
    raw_payload_retention_days: Mapped[int | None] = mapped_column(Integer)
    private_url_retention_days: Mapped[int | None] = mapped_column(Integer)
    retention_notes: Mapped[str | None] = mapped_column(Text)
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


class SourceCheckJob(Base):
    __tablename__ = "source_check_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("listing_sources.id"), index=True)
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    source_type: Mapped[str] = mapped_column(String(60), index=True)
    check_type: Mapped[str] = mapped_column(String(60), index=True)
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    target_domain: Mapped[str | None] = mapped_column(String(255), index=True)
    target_url_hash: Mapped[str | None] = mapped_column(String(128), index=True)
    created_by: Mapped[str] = mapped_column(String(120), default="system", index=True)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)
    notes: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    result_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source: Mapped[ListingSource | None] = relationship()


class SourceError(Base):
    __tablename__ = "source_errors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("listing_sources.id"), index=True)
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    source_type: Mapped[str] = mapped_column(String(60), index=True)
    source_check_job_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_check_jobs.id"),
        index=True,
    )
    ingestion_job_id: Mapped[str | None] = mapped_column(
        ForeignKey("ingestion_jobs.id"),
        index=True,
    )
    severity: Mapped[str] = mapped_column(String(40), index=True)
    status: Mapped[str] = mapped_column(String(40), default="open", index=True)
    error_code: Mapped[str] = mapped_column(String(100), index=True)
    message: Mapped[str] = mapped_column(Text)
    retryable: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    last_retry_job_id: Mapped[str | None] = mapped_column(
        ForeignKey("source_check_jobs.id"),
        index=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    resolved_by: Mapped[str | None] = mapped_column(String(120), index=True)
    resolution_note: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source: Mapped[ListingSource | None] = relationship()
    source_check_job: Mapped[SourceCheckJob | None] = relationship(
        foreign_keys=[source_check_job_id],
    )
    ingestion_job: Mapped[IngestionJob | None] = relationship()
    last_retry_job: Mapped[SourceCheckJob | None] = relationship(
        foreign_keys=[last_retry_job_id],
    )


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    action_type: Mapped[str] = mapped_column(String(120), index=True)
    actor_id: Mapped[str] = mapped_column(String(120), index=True)
    actor_role: Mapped[str] = mapped_column(String(40), index=True)
    resource_type: Mapped[str] = mapped_column(String(80), index=True)
    resource_id: Mapped[str | None] = mapped_column(String(200), index=True)
    status: Mapped[str] = mapped_column(String(40), default="succeeded", index=True)
    message: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class DataDeletionRequest(Base):
    __tablename__ = "data_deletion_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    target_type: Mapped[str] = mapped_column(String(60), index=True)
    target_id: Mapped[str] = mapped_column(String(200), index=True)
    target_owner_id: Mapped[str | None] = mapped_column(String(120), index=True)
    source_name: Mapped[str | None] = mapped_column(String(120), index=True)
    source_url_hash: Mapped[str | None] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(40), default="open", index=True)
    requested_by: Mapped[str] = mapped_column(String(120), index=True)
    processed_by: Mapped[str | None] = mapped_column(String(120), index=True)
    reason: Mapped[str | None] = mapped_column(Text)
    request_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    result_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    action_summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)


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
    voivodeship: Mapped[str | None] = mapped_column(String(80), index=True)
    city: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str | None] = mapped_column(String(80), index=True)
    municipality: Mapped[str | None] = mapped_column(String(80), index=True)
    market_type: Mapped[str | None] = mapped_column(String(40))
    building_type: Mapped[str | None] = mapped_column(String(80), index=True)
    renovation_state: Mapped[str | None] = mapped_column(String(80), index=True)
    has_balcony: Mapped[bool | None] = mapped_column(Boolean, index=True)
    has_terrace: Mapped[bool | None] = mapped_column(Boolean, index=True)
    has_garden: Mapped[bool | None] = mapped_column(Boolean, index=True)
    has_elevator: Mapped[bool | None] = mapped_column(Boolean, index=True)
    parking_type: Mapped[str | None] = mapped_column(String(80), index=True)
    heating_type: Mapped[str | None] = mapped_column(String(80), index=True)
    developer_id: Mapped[str | None] = mapped_column(String(120), index=True)
    developer_name: Mapped[str | None] = mapped_column(String(160), index=True)
    investment_name: Mapped[str | None] = mapped_column(String(200), index=True)
    primary_market_project_id: Mapped[str | None] = mapped_column(String(160), index=True)
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


class ListingEvent(Base):
    __tablename__ = "listing_events"
    __table_args__ = (
        UniqueConstraint(
            "property_source_id",
            "listing_snapshot_id",
            "event_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    property_source_id: Mapped[int] = mapped_column(ForeignKey("property_sources.id"), index=True)
    listing_snapshot_id: Mapped[int | None] = mapped_column(
        ForeignKey("listing_snapshots.id"),
        index=True,
    )
    previous_snapshot_id: Mapped[int | None] = mapped_column(ForeignKey("listing_snapshots.id"))
    listing_id: Mapped[str] = mapped_column(String(120), index=True)
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    summary: Mapped[str] = mapped_column(Text)
    event_payload: Mapped[dict] = mapped_column(JSONB, default=dict)

    property_source: Mapped[PropertySource] = relationship()


class PropertyDeduplicationMatch(Base):
    __tablename__ = "property_deduplication_matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[str | None] = mapped_column(ForeignKey("ingestion_jobs.id"), index=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey("listing_sources.id"))
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    source_listing_id: Mapped[str] = mapped_column(String(120), index=True)
    candidate_property_id: Mapped[int | None] = mapped_column(ForeignKey("properties.id"))
    matched_property_id: Mapped[int | None] = mapped_column(ForeignKey("properties.id"))
    decision: Mapped[str] = mapped_column(String(40), index=True)
    review_status: Mapped[str] = mapped_column(String(40), default="auto_resolved", index=True)
    match_score: Mapped[int] = mapped_column(Integer)
    reasons_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    incoming_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    candidate_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    job: Mapped[IngestionJob | None] = relationship()
    source: Mapped[ListingSource | None] = relationship()


class DeveloperProfileRow(Base):
    __tablename__ = "developer_profiles"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    legal_name: Mapped[str | None] = mapped_column(String(200), index=True)
    brand_names_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    krs: Mapped[str | None] = mapped_column(String(32), index=True)
    nip: Mapped[str | None] = mapped_column(String(32), index=True)
    regon: Mapped[str | None] = mapped_column(String(32), index=True)
    website_url: Mapped[str | None] = mapped_column(String(500))
    headquarters_city: Mapped[str | None] = mapped_column(String(120), index=True)
    founded_year: Mapped[int | None] = mapped_column(Integer)
    source_names_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class DeveloperProjectRow(Base):
    __tablename__ = "developer_projects"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    developer_id: Mapped[str] = mapped_column(
        ForeignKey("developer_profiles.id"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), index=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    district: Mapped[str | None] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(40), default="unknown", index=True)
    units_count: Mapped[int | None] = mapped_column(Integer)
    completed_year: Mapped[int | None] = mapped_column(Integer)
    source_url: Mapped[str | None] = mapped_column(String(500))

    developer: Mapped[DeveloperProfileRow] = relationship()


class DeveloperAliasRow(Base):
    __tablename__ = "developer_aliases"

    id: Mapped[str] = mapped_column(String(180), primary_key=True)
    developer_id: Mapped[str] = mapped_column(
        ForeignKey("developer_profiles.id"),
        index=True,
    )
    alias: Mapped[str] = mapped_column(String(220), index=True)
    alias_type: Mapped[str] = mapped_column(String(40), index=True)
    source_name: Mapped[str] = mapped_column(String(160), index=True)
    source_url: Mapped[str | None] = mapped_column(String(500))
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    developer: Mapped[DeveloperProfileRow] = relationship()


class DeveloperQualitySignalRow(Base):
    __tablename__ = "developer_quality_signals"

    id: Mapped[str] = mapped_column(String(180), primary_key=True)
    developer_id: Mapped[str] = mapped_column(
        ForeignKey("developer_profiles.id"),
        index=True,
    )
    signal_type: Mapped[str] = mapped_column(String(60), index=True)
    severity: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(220))
    summary: Mapped[str] = mapped_column(Text)
    source_name: Mapped[str] = mapped_column(String(160), index=True)
    source_url: Mapped[str | None] = mapped_column(String(500))
    observed_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    confidence_score: Mapped[int] = mapped_column(Integer, default=50)
    moderation_status: Mapped[str] = mapped_column(String(40), default="active", index=True)
    dispute_status: Mapped[str] = mapped_column(String(40), default="none", index=True)
    moderation_note: Mapped[str | None] = mapped_column(Text)
    disputed_by: Mapped[str | None] = mapped_column(String(120))
    disputed_at: Mapped[datetime | None] = mapped_column(DateTime)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
    reviewed_by: Mapped[str | None] = mapped_column(String(120))

    developer: Mapped[DeveloperProfileRow] = relationship()


class DeveloperReputationSnapshotRow(Base):
    __tablename__ = "developer_reputation_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    developer_id: Mapped[str] = mapped_column(
        ForeignKey("developer_profiles.id"),
        index=True,
    )
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    reputation_score: Mapped[int] = mapped_column(Integer)
    confidence_score: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(40), index=True)
    score_payload: Mapped[dict] = mapped_column(JSONB, default=dict)

    developer: Mapped[DeveloperProfileRow] = relationship()


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


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(220))
    summary: Mapped[str] = mapped_column(String(600))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(40), index=True)
    source_name: Mapped[str] = mapped_column(String(120))
    source_url: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    affected_area_ids_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    affected_districts_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    price_impact_hypothesis: Mapped[str | None] = mapped_column(Text)
    audience_relevance_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    impact_level: Mapped[str] = mapped_column(String(40), default="unknown", index=True)
    tags_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Municipality(Base):
    __tablename__ = "municipalities"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    country_code: Mapped[str] = mapped_column(String(2), default="PL")
    region: Mapped[str | None] = mapped_column(String(120))
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class District(Base):
    __tablename__ = "districts"
    __table_args__ = (UniqueConstraint("municipality_id", "slug"),)

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    area_id: Mapped[str | None] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    slug: Mapped[str] = mapped_column(String(120), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()


class LocationReference(Base):
    __tablename__ = "location_references"
    __table_args__ = (UniqueConstraint("municipality_id", "slug", "location_type"),)

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    slug: Mapped[str] = mapped_column(String(160), index=True)
    location_type: Mapped[str] = mapped_column(String(60), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    aliases_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class TransportStop(Base):
    __tablename__ = "transport_stops"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    stop_type: Mapped[str] = mapped_column(String(60), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lines_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    source_url: Mapped[str | None] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    route_number: Mapped[str] = mapped_column(String(40), index=True)
    route_name: Mapped[str] = mapped_column(String(160), index=True)
    route_type: Mapped[str] = mapped_column(String(60), index=True)
    operator: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(60), default="active", index=True)
    stop_ids_json: Mapped[list[str]] = mapped_column(JSONB, default=list)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class School(Base):
    __tablename__ = "schools"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    school_type: Mapped[str] = mapped_column(String(80), index=True)
    operator_type: Mapped[str | None] = mapped_column(String(80), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    source_url: Mapped[str | None] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class Kindergarten(Base):
    __tablename__ = "kindergartens"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    kindergarten_type: Mapped[str] = mapped_column(String(80), index=True)
    operator_type: Mapped[str | None] = mapped_column(String(80), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    source_url: Mapped[str | None] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    amenity_type: Mapped[str] = mapped_column(String(80), index=True)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    source_url: Mapped[str | None] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


class IndustrialZone(Base):
    __tablename__ = "industrial_zones"

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    municipality_id: Mapped[str] = mapped_column(ForeignKey("municipalities.id"), index=True)
    district_id: Mapped[str | None] = mapped_column(ForeignKey("districts.id"), index=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    zone_type: Mapped[str] = mapped_column(String(80), index=True)
    risk_level: Mapped[str] = mapped_column(String(40), default="unknown", index=True)
    impact_radius_m: Mapped[int | None] = mapped_column(Integer)
    lat: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    source_url: Mapped[str | None] = mapped_column(String(500))
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    municipality: Mapped[Municipality] = relationship()
    district: Mapped[District | None] = relationship()


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


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    subject_type: Mapped[str] = mapped_column(String(60), index=True)
    subject_id: Mapped[str] = mapped_column(String(160), index=True)
    insight_type: Mapped[str] = mapped_column(String(80), index=True)
    provider: Mapped[str] = mapped_column(String(80), default="domarion_rule_based")
    model_name: Mapped[str] = mapped_column(String(120), default="domarion-deterministic-v1")
    prompt_version: Mapped[str] = mapped_column(String(120), default="report-insight-v1")
    source_report_id: Mapped[str | None] = mapped_column(
        ForeignKey("generated_reports.id"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    input_hash: Mapped[str] = mapped_column(String(128), index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    source_report: Mapped[GeneratedReport | None] = relationship()


class UserSubmittedListingDraft(Base):
    __tablename__ = "user_submitted_listing_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    listing_id: Mapped[str] = mapped_column(String(120), index=True)
    source_url_private: Mapped[str | None] = mapped_column(String(1000))
    source_domain: Mapped[str | None] = mapped_column(String(255), index=True)
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str] = mapped_column(String(80), index=True)
    market_type: Mapped[str] = mapped_column(String(40), index=True)
    developer_id: Mapped[str | None] = mapped_column(String(120), index=True)
    developer_name: Mapped[str | None] = mapped_column(String(160), index=True)
    investment_name: Mapped[str | None] = mapped_column(String(200), index=True)
    primary_market_project_id: Mapped[str | None] = mapped_column(String(160), index=True)
    price: Mapped[int] = mapped_column(Integer)
    area_m2: Mapped[Decimal] = mapped_column(Numeric(8, 2))
    rooms: Mapped[int] = mapped_column(Integer)
    data_quality_score: Mapped[int] = mapped_column(Integer)
    confidence_score: Mapped[int] = mapped_column(Integer)
    request_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    analysis_payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PartnerReferralLead(Base):
    __tablename__ = "partner_referral_leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(120), index=True)
    referral_type: Mapped[str] = mapped_column(String(40), index=True)
    status: Mapped[str] = mapped_column(String(40), default="new", index=True)
    source_context: Mapped[str] = mapped_column(String(120), index=True)
    listing_id: Mapped[str | None] = mapped_column(String(120), index=True)
    report_id: Mapped[str | None] = mapped_column(String(120), index=True)
    city: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str | None] = mapped_column(String(80), index=True)
    contact_name: Mapped[str | None] = mapped_column(String(160))
    contact_email: Mapped[str | None] = mapped_column(String(255), index=True)
    contact_phone: Mapped[str | None] = mapped_column(String(80))
    message: Mapped[str | None] = mapped_column(Text)
    consent_to_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    assigned_to: Mapped[str | None] = mapped_column(String(120), index=True)
    partner_name: Mapped[str | None] = mapped_column(String(160))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


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


class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    billing_email: Mapped[str | None] = mapped_column(String(160), index=True)
    website_url: Mapped[str | None] = mapped_column(String(240))
    city: Mapped[str | None] = mapped_column(String(120), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship()


class AgencyMembership(Base):
    __tablename__ = "agency_memberships"
    __table_args__ = (UniqueConstraint("agency_id", "user_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    agency_id: Mapped[str] = mapped_column(ForeignKey("agencies.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    email: Mapped[str | None] = mapped_column(String(160), index=True)
    display_name: Mapped[str | None] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(40), default="agent", index=True)
    status: Mapped[str] = mapped_column(String(40), default="active", index=True)
    invited_by: Mapped[str | None] = mapped_column(String(120), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    agency: Mapped[Agency] = relationship()
    user: Mapped[User] = relationship(foreign_keys=[user_id])


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
    billing_details_json: Mapped[dict] = mapped_column(JSONB, default=dict)
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
