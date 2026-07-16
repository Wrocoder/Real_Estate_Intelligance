"""Add listing lifestyle attribute filters.

Revision ID: 0024_listing_lifestyle_attributes
Revises: 0023_listing_building_attributes
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0024_listing_lifestyle_attributes"
down_revision: str | None = "0023_listing_building_attributes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("has_balcony", sa.Boolean(), nullable=True))
    op.add_column("properties", sa.Column("has_terrace", sa.Boolean(), nullable=True))
    op.add_column("properties", sa.Column("has_garden", sa.Boolean(), nullable=True))
    op.add_column("properties", sa.Column("has_elevator", sa.Boolean(), nullable=True))
    op.add_column("properties", sa.Column("parking_type", sa.String(length=80), nullable=True))
    op.add_column("properties", sa.Column("heating_type", sa.String(length=80), nullable=True))
    op.create_index("ix_properties_has_balcony", "properties", ["has_balcony"])
    op.create_index("ix_properties_has_terrace", "properties", ["has_terrace"])
    op.create_index("ix_properties_has_garden", "properties", ["has_garden"])
    op.create_index("ix_properties_has_elevator", "properties", ["has_elevator"])
    op.create_index("ix_properties_parking_type", "properties", ["parking_type"])
    op.create_index("ix_properties_heating_type", "properties", ["heating_type"])


def downgrade() -> None:
    op.drop_index("ix_properties_heating_type", table_name="properties")
    op.drop_index("ix_properties_parking_type", table_name="properties")
    op.drop_index("ix_properties_has_elevator", table_name="properties")
    op.drop_index("ix_properties_has_garden", table_name="properties")
    op.drop_index("ix_properties_has_terrace", table_name="properties")
    op.drop_index("ix_properties_has_balcony", table_name="properties")
    op.drop_column("properties", "heating_type")
    op.drop_column("properties", "parking_type")
    op.drop_column("properties", "has_elevator")
    op.drop_column("properties", "has_garden")
    op.drop_column("properties", "has_terrace")
    op.drop_column("properties", "has_balcony")
