"""Add listing events.

Revision ID: 0015_listing_events
Revises: 0014_spatial_indexes
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0015_listing_events"
down_revision: str | None = "0014_spatial_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "listing_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_source_id", sa.Integer(), nullable=False),
        sa.Column("listing_snapshot_id", sa.Integer(), nullable=True),
        sa.Column("previous_snapshot_id", sa.Integer(), nullable=True),
        sa.Column("listing_id", sa.String(length=120), nullable=False),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("observed_at", sa.DateTime(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("event_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["listing_snapshot_id"], ["listing_snapshots.id"]),
        sa.ForeignKeyConstraint(["previous_snapshot_id"], ["listing_snapshots.id"]),
        sa.ForeignKeyConstraint(["property_source_id"], ["property_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "property_source_id",
            "listing_snapshot_id",
            "event_type",
            name="uq_listing_events_source_snapshot_type",
        ),
    )
    op.create_index("ix_listing_events_event_type", "listing_events", ["event_type"])
    op.create_index("ix_listing_events_listing_id", "listing_events", ["listing_id"])
    op.create_index("ix_listing_events_observed_at", "listing_events", ["observed_at"])
    op.create_index(
        "ix_listing_events_property_source_id",
        "listing_events",
        ["property_source_id"],
    )
    op.create_index(
        "ix_listing_events_listing_snapshot_id",
        "listing_events",
        ["listing_snapshot_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_listing_events_listing_snapshot_id", table_name="listing_events")
    op.drop_index("ix_listing_events_property_source_id", table_name="listing_events")
    op.drop_index("ix_listing_events_observed_at", table_name="listing_events")
    op.drop_index("ix_listing_events_listing_id", table_name="listing_events")
    op.drop_index("ix_listing_events_event_type", table_name="listing_events")
    op.drop_table("listing_events")
