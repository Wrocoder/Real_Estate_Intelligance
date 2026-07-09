"""Add favorites and user alerts.

Revision ID: 0003_favorites_alerts
Revises: 0002_generated_reports
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_favorites_alerts"
down_revision: str | None = "0002_generated_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_favorites",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("listing_id", sa.String(length=120), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "listing_id"),
    )
    op.create_index("ix_user_favorites_created_at", "user_favorites", ["created_at"])
    op.create_index("ix_user_favorites_listing_id", "user_favorites", ["listing_id"])
    op.create_index("ix_user_favorites_owner_id", "user_favorites", ["owner_id"])

    op.create_table(
        "user_alerts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("frequency", sa.String(length=40), nullable=False),
        sa.Column("filters", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_alerts_created_at", "user_alerts", ["created_at"])
    op.create_index("ix_user_alerts_is_active", "user_alerts", ["is_active"])
    op.create_index("ix_user_alerts_owner_id", "user_alerts", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_user_alerts_owner_id", table_name="user_alerts")
    op.drop_index("ix_user_alerts_is_active", table_name="user_alerts")
    op.drop_index("ix_user_alerts_created_at", table_name="user_alerts")
    op.drop_table("user_alerts")
    op.drop_index("ix_user_favorites_owner_id", table_name="user_favorites")
    op.drop_index("ix_user_favorites_listing_id", table_name="user_favorites")
    op.drop_index("ix_user_favorites_created_at", table_name="user_favorites")
    op.drop_table("user_favorites")
