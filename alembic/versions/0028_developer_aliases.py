"""Add developer aliases.

Revision ID: 0028_developer_aliases
Revises: 0027_listing_developer_metadata
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0028_developer_aliases"
down_revision: str | None = "0027_listing_developer_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "developer_aliases",
        sa.Column("id", sa.String(length=180), nullable=False),
        sa.Column("developer_id", sa.String(length=120), nullable=False),
        sa.Column("alias", sa.String(length=220), nullable=False),
        sa.Column("alias_type", sa.String(length=40), nullable=False),
        sa.Column("source_name", sa.String(length=160), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["developer_id"], ["developer_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_developer_aliases_developer_id", "developer_aliases", ["developer_id"])
    op.create_index("ix_developer_aliases_alias", "developer_aliases", ["alias"])
    op.create_index("ix_developer_aliases_alias_type", "developer_aliases", ["alias_type"])
    op.create_index("ix_developer_aliases_source_name", "developer_aliases", ["source_name"])
    op.create_index("ix_developer_aliases_active", "developer_aliases", ["active"])


def downgrade() -> None:
    op.drop_index("ix_developer_aliases_active", table_name="developer_aliases")
    op.drop_index("ix_developer_aliases_source_name", table_name="developer_aliases")
    op.drop_index("ix_developer_aliases_alias_type", table_name="developer_aliases")
    op.drop_index("ix_developer_aliases_alias", table_name="developer_aliases")
    op.drop_index("ix_developer_aliases_developer_id", table_name="developer_aliases")
    op.drop_table("developer_aliases")
