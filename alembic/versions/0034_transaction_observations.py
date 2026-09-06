"""Add separate RCN transaction observations and market provenance."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0034_transaction_observations"
down_revision: str | None = "0033_password_credentials"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "transaction_observations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("ingestion_job_id", sa.String(length=36), nullable=True),
        sa.Column("source_observation_id", sa.String(length=180), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("source_namespace", sa.String(length=180), nullable=True),
        sa.Column("source_version", sa.String(length=80), nullable=True),
        sa.Column("teryt", sa.String(length=20), nullable=True),
        sa.Column("transaction_date", sa.DateTime(), nullable=False),
        sa.Column("observed_at", sa.DateTime(), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=True),
        sa.Column("area_id", sa.String(length=120), nullable=True),
        sa.Column("municipality", sa.String(length=120), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("property_type", sa.String(length=80), nullable=True),
        sa.Column("property_right", sa.String(length=120), nullable=True),
        sa.Column("transaction_type", sa.String(length=80), nullable=True),
        sa.Column("market_type", sa.String(length=40), nullable=True),
        sa.Column("property_price_gross", sa.Integer(), nullable=False),
        sa.Column("transaction_price_gross", sa.Integer(), nullable=True),
        sa.Column("vat_amount", sa.Integer(), nullable=True),
        sa.Column("price_basis", sa.String(length=30), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("area_m2", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column("price_per_m2", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("ancillary_area_m2", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("lat", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("lon", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("geometry_x", sa.Numeric(precision=14, scale=3), nullable=True),
        sa.Column("geometry_y", sa.Numeric(precision=14, scale=3), nullable=True),
        sa.Column("geometry_crs", sa.String(length=80), nullable=True),
        sa.Column("data_quality_score", sa.Integer(), nullable=False),
        sa.Column("normalized_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["ingestion_job_id"], ["ingestion_jobs.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_id", "source_observation_id"),
    )
    for name, columns in (
        ("ix_transaction_observations_source_id", ["source_id"]),
        ("ix_transaction_observations_ingestion_job_id", ["ingestion_job_id"]),
        ("ix_transaction_observations_teryt", ["teryt"]),
        ("ix_transaction_observations_transaction_date", ["transaction_date"]),
        ("ix_transaction_observations_observed_at", ["observed_at"]),
        ("ix_transaction_observations_city", ["city"]),
        ("ix_transaction_observations_district", ["district"]),
        ("ix_transaction_observations_area_id", ["area_id"]),
        ("ix_transaction_observations_property_type", ["property_type"]),
        ("ix_transaction_observations_market_type", ["market_type"]),
        ("ix_transaction_observations_price_per_m2", ["price_per_m2"]),
    ):
        op.create_index(name, "transaction_observations", columns)

    op.add_column(
        "area_statistics",
        sa.Column(
            "price_basis",
            sa.String(length=40),
            nullable=False,
            server_default="listing_observed",
        ),
    )
    op.add_column(
        "area_statistics",
        sa.Column(
            "listing_metrics_available",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "area_statistics",
        sa.Column(
            "transaction_observation_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "area_statistics",
        sa.Column("transaction_median_price_per_m2", sa.Integer(), nullable=True),
    )
    op.add_column("area_statistics", sa.Column("transaction_observed_from", sa.DateTime()))
    op.add_column("area_statistics", sa.Column("transaction_observed_to", sa.DateTime()))
    op.add_column(
        "area_statistics",
        sa.Column(
            "data_sources_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
    )
    op.alter_column("area_statistics", "price_basis", server_default=None)
    op.alter_column("area_statistics", "listing_metrics_available", server_default=None)
    op.alter_column("area_statistics", "transaction_observation_count", server_default=None)
    op.alter_column("area_statistics", "data_sources_json", server_default=None)


def downgrade() -> None:
    for name in (
        "ix_transaction_observations_price_per_m2",
        "ix_transaction_observations_market_type",
        "ix_transaction_observations_property_type",
        "ix_transaction_observations_area_id",
        "ix_transaction_observations_district",
        "ix_transaction_observations_city",
        "ix_transaction_observations_observed_at",
        "ix_transaction_observations_transaction_date",
        "ix_transaction_observations_teryt",
        "ix_transaction_observations_ingestion_job_id",
        "ix_transaction_observations_source_id",
    ):
        op.drop_index(name, table_name="transaction_observations")
    op.drop_table("transaction_observations")
    for column in (
        "data_sources_json",
        "transaction_observed_to",
        "transaction_observed_from",
        "transaction_median_price_per_m2",
        "transaction_observation_count",
        "listing_metrics_available",
        "price_basis",
    ):
        op.drop_column("area_statistics", column)
