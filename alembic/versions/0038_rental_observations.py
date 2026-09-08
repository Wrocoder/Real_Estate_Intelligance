"""Add versioned observations from approved rental sources."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0038_rental_observations"
down_revision: str | None = "0037_nullable_context_scores"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rental_observations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("ingestion_job_id", sa.String(length=36), nullable=True),
        sa.Column("source_observation_id", sa.String(length=180), nullable=False),
        sa.Column("content_hash", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("observed_at", sa.DateTime(), nullable=False),
        sa.Column("last_confirmed_at", sa.DateTime(), nullable=False),
        sa.Column("active_status", sa.String(length=40), nullable=False, server_default="active"),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=True),
        sa.Column("area_id", sa.String(length=120), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column(
            "property_type",
            sa.String(length=80),
            nullable=False,
            server_default="apartment",
        ),
        sa.Column("building_type", sa.String(length=80), nullable=True),
        sa.Column("monthly_rent_pln", sa.Integer(), nullable=False),
        sa.Column("admin_fee_monthly_pln", sa.Integer(), nullable=True),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="PLN"),
        sa.Column("area_m2", sa.Numeric(8, 2), nullable=False),
        sa.Column("rent_per_m2_pln", sa.Numeric(10, 2), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("building_year", sa.Integer(), nullable=True),
        sa.Column("furnished", sa.Boolean(), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("data_quality_score", sa.Integer(), nullable=False, server_default="50"),
        sa.Column(
            "normalized_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.ForeignKeyConstraint(["ingestion_job_id"], ["ingestion_jobs.id"]),
        sa.UniqueConstraint(
            "source_id",
            "source_observation_id",
            "content_hash",
            name="uq_rental_observations_source_version",
        ),
    )
    for name, columns in (
        ("ix_rental_observations_source_id", ["source_id"]),
        ("ix_rental_observations_ingestion_job_id", ["ingestion_job_id"]),
        ("ix_rental_observations_source_observation_id", ["source_observation_id"]),
        ("ix_rental_observations_observed_at", ["observed_at"]),
        ("ix_rental_observations_last_confirmed_at", ["last_confirmed_at"]),
        ("ix_rental_observations_active_status", ["active_status"]),
        ("ix_rental_observations_city", ["city"]),
        ("ix_rental_observations_district", ["district"]),
        ("ix_rental_observations_area_id", ["area_id"]),
        ("ix_rental_observations_property_type", ["property_type"]),
        ("ix_rental_observations_building_type", ["building_type"]),
        ("ix_rental_observations_rent_per_m2_pln", ["rent_per_m2_pln"]),
        ("ix_rental_observations_rooms", ["rooms"]),
    ):
        op.create_index(name, "rental_observations", columns)


def downgrade() -> None:
    op.drop_table("rental_observations")
