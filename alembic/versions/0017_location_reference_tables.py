"""Add location reference tables.

Revision ID: 0017_location_reference_tables
Revises: 0016_property_deduplication_matches
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0017_location_reference_tables"
down_revision: str | None = "0016_property_deduplication_matches"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "municipalities",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("country_code", sa.String(length=2), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_municipalities_name"),
    )
    op.create_index("ix_municipalities_name", "municipalities", ["name"])

    op.create_table(
        "districts",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("area_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("municipality_id", "slug", name="uq_districts_municipality_slug"),
    )
    op.create_index("ix_districts_area_id", "districts", ["area_id"])
    op.create_index("ix_districts_municipality_id", "districts", ["municipality_id"])
    op.create_index("ix_districts_name", "districts", ["name"])
    op.create_index("ix_districts_slug", "districts", ["slug"])

    op.create_table(
        "location_references",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("location_type", sa.String(length=60), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("aliases_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "municipality_id",
            "slug",
            "location_type",
            name="uq_location_references_municipality_slug_type",
        ),
    )
    op.create_index("ix_location_references_district_id", "location_references", ["district_id"])
    op.create_index(
        "ix_location_references_location_type",
        "location_references",
        ["location_type"],
    )
    op.create_index(
        "ix_location_references_municipality_id",
        "location_references",
        ["municipality_id"],
    )
    op.create_index("ix_location_references_name", "location_references", ["name"])
    op.create_index("ix_location_references_slug", "location_references", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_location_references_slug", table_name="location_references")
    op.drop_index("ix_location_references_name", table_name="location_references")
    op.drop_index(
        "ix_location_references_municipality_id",
        table_name="location_references",
    )
    op.drop_index("ix_location_references_location_type", table_name="location_references")
    op.drop_index("ix_location_references_district_id", table_name="location_references")
    op.drop_table("location_references")
    op.drop_index("ix_districts_slug", table_name="districts")
    op.drop_index("ix_districts_name", table_name="districts")
    op.drop_index("ix_districts_municipality_id", table_name="districts")
    op.drop_index("ix_districts_area_id", table_name="districts")
    op.drop_table("districts")
    op.drop_index("ix_municipalities_name", table_name="municipalities")
    op.drop_table("municipalities")
