"""Add source registry metadata.

Revision ID: 0010_source_registry_metadata
Revises: 0009_area_market_snapshots
Create Date: 2026-07-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0010_source_registry_metadata"
down_revision: str | None = "0009_area_market_snapshots"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "listing_sources",
        sa.Column("legal_status", sa.String(length=40), nullable=False, server_default="unknown"),
    )
    op.add_column(
        "listing_sources",
        sa.Column("refresh_cadence", sa.String(length=80), nullable=False, server_default="manual"),
    )
    op.add_column(
        "listing_sources",
        sa.Column("owner", sa.String(length=120), nullable=False, server_default="internal"),
    )
    op.add_column(
        "listing_sources",
        sa.Column(
            "ingestion_method",
            sa.String(length=80),
            nullable=False,
            server_default="manual",
        ),
    )
    op.add_column(
        "listing_sources",
        sa.Column(
            "allowed_use_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "listing_sources",
        sa.Column("robots_txt_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "listing_sources",
        sa.Column("terms_url", sa.String(length=500), nullable=True),
    )
    op.add_column("listing_sources", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column(
        "listing_sources",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "listing_sources",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    for column_name in (
        "legal_status",
        "refresh_cadence",
        "owner",
        "ingestion_method",
        "allowed_use_json",
        "is_active",
        "updated_at",
    ):
        op.alter_column("listing_sources", column_name, server_default=None)


def downgrade() -> None:
    op.drop_column("listing_sources", "updated_at")
    op.drop_column("listing_sources", "is_active")
    op.drop_column("listing_sources", "notes")
    op.drop_column("listing_sources", "terms_url")
    op.drop_column("listing_sources", "robots_txt_url")
    op.drop_column("listing_sources", "allowed_use_json")
    op.drop_column("listing_sources", "ingestion_method")
    op.drop_column("listing_sources", "owner")
    op.drop_column("listing_sources", "refresh_cadence")
    op.drop_column("listing_sources", "legal_status")
