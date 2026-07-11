"""Add user-submitted listing drafts.

Revision ID: 0012_user_submitted_listing_drafts
Revises: 0011_listing_snapshot_history_constraints
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0012_user_submitted_listing_drafts"
down_revision: str | None = "0011_listing_snapshot_history_constraints"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_submitted_listing_drafts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("listing_id", sa.String(length=120), nullable=False),
        sa.Column("source_url_private", sa.String(length=1000), nullable=True),
        sa.Column("source_domain", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=False),
        sa.Column("market_type", sa.String(length=40), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("area_m2", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=False),
        sa.Column("data_quality_score", sa.Integer(), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("request_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("analysis_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_city",
        "user_submitted_listing_drafts",
        ["city"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_created_at",
        "user_submitted_listing_drafts",
        ["created_at"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_district",
        "user_submitted_listing_drafts",
        ["district"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_expires_at",
        "user_submitted_listing_drafts",
        ["expires_at"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_listing_id",
        "user_submitted_listing_drafts",
        ["listing_id"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_market_type",
        "user_submitted_listing_drafts",
        ["market_type"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_owner_id",
        "user_submitted_listing_drafts",
        ["owner_id"],
    )
    op.create_index(
        "ix_user_submitted_listing_drafts_source_domain",
        "user_submitted_listing_drafts",
        ["source_domain"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_submitted_listing_drafts_source_domain",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_owner_id",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_market_type",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_listing_id",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_expires_at",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_district",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_created_at",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_index(
        "ix_user_submitted_listing_drafts_city",
        table_name="user_submitted_listing_drafts",
    )
    op.drop_table("user_submitted_listing_drafts")
