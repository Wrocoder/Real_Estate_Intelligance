"""Add area market snapshots.

Revision ID: 0009_area_market_snapshots
Revises: 0008_payment_webhooks
Create Date: 2026-07-11
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009_area_market_snapshots"
down_revision: str | None = "0008_payment_webhooks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "area_market_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_area_market_snapshots_area_id",
        "area_market_snapshots",
        ["area_id"],
    )
    op.create_index(
        "ix_area_market_snapshots_calculated_at",
        "area_market_snapshots",
        ["calculated_at"],
    )
    op.create_index(
        "ix_area_market_snapshots_city",
        "area_market_snapshots",
        ["city"],
    )


def downgrade() -> None:
    op.drop_index("ix_area_market_snapshots_city", table_name="area_market_snapshots")
    op.drop_index("ix_area_market_snapshots_calculated_at", table_name="area_market_snapshots")
    op.drop_index("ix_area_market_snapshots_area_id", table_name="area_market_snapshots")
    op.drop_table("area_market_snapshots")
