"""Initial Domarion Analytics schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "listing_sources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("base_url", sa.String(length=255), nullable=True),
        sa.Column("source_type", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "area_statistics",
        sa.Column("area_id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("median_price_per_m2", sa.Integer(), nullable=False),
        sa.Column("average_price_per_m2", sa.Integer(), nullable=False),
        sa.Column("active_listings", sa.Integer(), nullable=False),
        sa.Column("new_listings_30d", sa.Integer(), nullable=False),
        sa.Column("removed_listings_30d", sa.Integer(), nullable=False),
        sa.Column("average_days_on_market", sa.Integer(), nullable=False),
        sa.Column("price_change_90d_pct", sa.Float(), nullable=False),
        sa.Column("supply_change_90d_pct", sa.Float(), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("area_id"),
    )
    op.create_index("ix_area_statistics_city", "area_statistics", ["city"])

    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("canonical_address", sa.String(length=255), nullable=True),
        sa.Column("area_id", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=True),
        sa.Column("municipality", sa.String(length=80), nullable=True),
        sa.Column("market_type", sa.String(length=40), nullable=True),
        sa.Column("lat", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("lon", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("area_m2", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("building_floors", sa.Integer(), nullable=True),
        sa.Column("building_year", sa.Integer(), nullable=True),
        sa.Column("distance_to_center_km", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("nearest_stop_m", sa.Integer(), nullable=True),
        sa.Column("nearest_school_m", sa.Integer(), nullable=True),
        sa.Column("nearest_major_road_m", sa.Integer(), nullable=True),
        sa.Column("nearest_industrial_zone_m", sa.Integer(), nullable=True),
        sa.Column("parks_within_1km", sa.Integer(), nullable=True),
        sa.Column("schools_within_1km", sa.Integer(), nullable=True),
        sa.Column("planned_investments_within_2km", sa.Integer(), nullable=True),
        sa.Column("data_quality_score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_area_id", "properties", ["area_id"])
    op.create_index("ix_properties_city", "properties", ["city"])
    op.create_index("ix_properties_district", "properties", ["district"])
    op.create_index("ix_properties_municipality", "properties", ["municipality"])

    op.create_table(
        "planned_investments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("investment_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=60), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=True),
        sa.Column("expected_year", sa.Integer(), nullable=True),
        sa.Column("lat", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("lon", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_planned_investments_city", "planned_investments", ["city"])
    op.create_index("ix_planned_investments_district", "planned_investments", ["district"])

    op.create_table(
        "raw_listings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("source_listing_id", sa.String(length=120), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("fetched_at", sa.DateTime(), nullable=False),
        sa.Column("payload_hash", sa.String(length=128), nullable=False),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_id", "source_listing_id"),
    )

    op.create_table(
        "property_sources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("source_listing_id", sa.String(length=120), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.Column("active_status", sa.String(length=40), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "source_id", "source_listing_id"),
    )

    op.create_table(
        "property_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
        sa.Column("investment_score", sa.Integer(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("negotiation_score", sa.Integer(), nullable=False),
        sa.Column("liquidity_score", sa.Integer(), nullable=False),
        sa.Column("rental_potential_score", sa.Integer(), nullable=False),
        sa.Column("fair_price_low", sa.Integer(), nullable=True),
        sa.Column("fair_price_mid", sa.Integer(), nullable=True),
        sa.Column("fair_price_high", sa.Integer(), nullable=True),
        sa.Column("explanation_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "listing_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_source_id", sa.Integer(), nullable=False),
        sa.Column("observed_at", sa.DateTime(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("area_m2", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description_hash", sa.String(length=128), nullable=True),
        sa.Column("normalized_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["property_source_id"], ["property_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_listing_snapshots_observed_at", "listing_snapshots", ["observed_at"])


def downgrade() -> None:
    op.drop_index("ix_listing_snapshots_observed_at", table_name="listing_snapshots")
    op.drop_table("listing_snapshots")
    op.drop_table("property_scores")
    op.drop_table("property_sources")
    op.drop_table("raw_listings")
    op.drop_index("ix_planned_investments_district", table_name="planned_investments")
    op.drop_index("ix_planned_investments_city", table_name="planned_investments")
    op.drop_table("planned_investments")
    op.drop_index("ix_properties_municipality", table_name="properties")
    op.drop_index("ix_properties_district", table_name="properties")
    op.drop_index("ix_properties_city", table_name="properties")
    op.drop_index("ix_properties_area_id", table_name="properties")
    op.drop_table("properties")
    op.drop_index("ix_area_statistics_city", table_name="area_statistics")
    op.drop_table("area_statistics")
    op.drop_table("listing_sources")
