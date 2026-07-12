"""Add infrastructure reference tables.

Revision ID: 0018_infrastructure_reference_tables
Revises: 0017_location_reference_tables
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0018_infrastructure_reference_tables"
down_revision: str | None = "0017_location_reference_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

POINT_TABLES = (
    "transport_stops",
    "schools",
    "kindergartens",
    "amenities",
    "industrial_zones",
)


def upgrade() -> None:
    op.create_table(
        "transport_stops",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("stop_type", sa.String(length=60), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("lines_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "transport_routes",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("route_number", sa.String(length=40), nullable=False),
        sa.Column("route_name", sa.String(length=160), nullable=False),
        sa.Column("route_type", sa.String(length=60), nullable=False),
        sa.Column("operator", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=60), nullable=False),
        sa.Column("stop_ids_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "schools",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("school_type", sa.String(length=80), nullable=False),
        sa.Column("operator_type", sa.String(length=80), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "kindergartens",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("kindergarten_type", sa.String(length=80), nullable=False),
        sa.Column("operator_type", sa.String(length=80), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "amenities",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("amenity_type", sa.String(length=80), nullable=False),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "industrial_zones",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("municipality_id", sa.String(length=120), nullable=False),
        sa.Column("district_id", sa.String(length=120), nullable=True),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("zone_type", sa.String(length=80), nullable=False),
        sa.Column("risk_level", sa.String(length=40), nullable=False),
        sa.Column("impact_radius_m", sa.Integer(), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["municipality_id"], ["municipalities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    for table_name in POINT_TABLES:
        _add_generated_point(table_name)
        op.execute(
            f"""
            CREATE INDEX ix_{table_name}_geom_gist
            ON {table_name}
            USING GIST (geom)
            WHERE geom IS NOT NULL
            """
        )

    _create_common_indexes()


def downgrade() -> None:
    for table_name in reversed(POINT_TABLES):
        op.execute(f"DROP INDEX IF EXISTS ix_{table_name}_geom_gist")
        op.execute(f"ALTER TABLE {table_name} DROP COLUMN IF EXISTS geom")

    for table_name in (
        "industrial_zones",
        "amenities",
        "kindergartens",
        "schools",
        "transport_routes",
        "transport_stops",
    ):
        op.drop_table(table_name)


def _add_generated_point(table_name: str) -> None:
    op.execute(
        f"""
        ALTER TABLE {table_name}
        ADD COLUMN geom geometry(Point, 4326)
        GENERATED ALWAYS AS (
            CASE
                WHEN lat IS NOT NULL AND lon IS NOT NULL
                THEN ST_SetSRID(
                    ST_MakePoint(lon::double precision, lat::double precision),
                    4326
                )
                ELSE NULL
            END
        ) STORED
        """
    )


def _create_common_indexes() -> None:
    for table_name in (
        "transport_stops",
        "transport_routes",
        "schools",
        "kindergartens",
        "amenities",
        "industrial_zones",
    ):
        op.create_index(f"ix_{table_name}_municipality_id", table_name, ["municipality_id"])
        op.create_index(f"ix_{table_name}_district_id", table_name, ["district_id"])
        name_column = "route_name" if table_name == "transport_routes" else "name"
        op.create_index(f"ix_{table_name}_name", table_name, [name_column])

    op.create_index("ix_transport_stops_stop_type", "transport_stops", ["stop_type"])
    op.create_index("ix_transport_routes_route_number", "transport_routes", ["route_number"])
    op.create_index("ix_transport_routes_route_type", "transport_routes", ["route_type"])
    op.create_index("ix_transport_routes_status", "transport_routes", ["status"])
    op.create_index("ix_schools_school_type", "schools", ["school_type"])
    op.create_index("ix_schools_operator_type", "schools", ["operator_type"])
    op.create_index("ix_kindergartens_kindergarten_type", "kindergartens", ["kindergarten_type"])
    op.create_index("ix_kindergartens_operator_type", "kindergartens", ["operator_type"])
    op.create_index("ix_amenities_amenity_type", "amenities", ["amenity_type"])
    op.create_index("ix_industrial_zones_zone_type", "industrial_zones", ["zone_type"])
    op.create_index("ix_industrial_zones_risk_level", "industrial_zones", ["risk_level"])
