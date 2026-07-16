"""Add listing building attribute filters.

Revision ID: 0023_listing_building_attributes
Revises: 0022_agency_workspaces
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0023_listing_building_attributes"
down_revision: str | None = "0022_agency_workspaces"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("voivodeship", sa.String(length=80), nullable=True))
    op.add_column("properties", sa.Column("building_type", sa.String(length=80), nullable=True))
    op.add_column(
        "properties",
        sa.Column("renovation_state", sa.String(length=80), nullable=True),
    )
    op.create_index("ix_properties_voivodeship", "properties", ["voivodeship"])
    op.create_index("ix_properties_building_type", "properties", ["building_type"])
    op.create_index("ix_properties_renovation_state", "properties", ["renovation_state"])


def downgrade() -> None:
    op.drop_index("ix_properties_renovation_state", table_name="properties")
    op.drop_index("ix_properties_building_type", table_name="properties")
    op.drop_index("ix_properties_voivodeship", table_name="properties")
    op.drop_column("properties", "renovation_state")
    op.drop_column("properties", "building_type")
    op.drop_column("properties", "voivodeship")
