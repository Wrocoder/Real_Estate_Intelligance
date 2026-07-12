"""Expand Alembic version length.

Revision ID: 0010b_version_len
Revises: 0010_source_registry_metadata
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010b_version_len"
down_revision: str | None = "0010_source_registry_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "alembic_version",
        "version_num",
        existing_type=sa.String(length=32),
        type_=sa.String(length=128),
        existing_nullable=False,
    )


def downgrade() -> None:
    # Keep the wider column on downgrade so databases currently stamped with
    # long revision IDs can still move backward safely.
    pass
