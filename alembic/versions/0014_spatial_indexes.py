"""Add geometry columns and spatial indexes.

Revision ID: 0014_spatial_indexes
Revises: 0013_partner_referral_leads
Create Date: 2026-07-12
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0014_spatial_indexes"
down_revision: str | None = "0013_partner_referral_leads"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE properties
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
    op.execute(
        """
        ALTER TABLE planned_investments
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
    op.execute(
        """
        CREATE INDEX ix_properties_geom_gist
        ON properties
        USING GIST (geom)
        WHERE geom IS NOT NULL
        """
    )
    op.execute(
        """
        CREATE INDEX ix_planned_investments_geom_gist
        ON planned_investments
        USING GIST (geom)
        WHERE geom IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_planned_investments_geom_gist")
    op.execute("DROP INDEX IF EXISTS ix_properties_geom_gist")
    op.execute("ALTER TABLE planned_investments DROP COLUMN IF EXISTS geom")
    op.execute("ALTER TABLE properties DROP COLUMN IF EXISTS geom")
