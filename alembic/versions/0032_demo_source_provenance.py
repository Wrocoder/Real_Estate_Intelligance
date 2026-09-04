"""Add explicit demo provenance to listing sources.

Revision ID: 0032_demo_source_provenance
Revises: 0031_developer_signal_moderation
Create Date: 2026-09-03
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0032_demo_source_provenance"
down_revision: str | None = "0031_developer_signal_moderation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "listing_sources",
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        """
        update listing_sources
        set is_demo = true
        where lower(source_type) in ('demo', 'sample', 'seed', 'fixture')
           or lower(name) like '%demo%'
           or lower(name) like '%sample%'
        """
    )
    op.create_index("ix_listing_sources_is_demo", "listing_sources", ["is_demo"])


def downgrade() -> None:
    op.drop_index("ix_listing_sources_is_demo", table_name="listing_sources")
    op.drop_column("listing_sources", "is_demo")
