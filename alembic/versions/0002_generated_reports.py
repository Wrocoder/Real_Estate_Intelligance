"""Add generated reports table.

Revision ID: 0002_generated_reports
Revises: 0001_initial_schema
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_generated_reports"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "generated_reports",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("listing_id", sa.String(length=120), nullable=False),
        sa.Column("audience", sa.String(length=40), nullable=False),
        sa.Column("report_format", sa.String(length=20), nullable=False),
        sa.Column("content_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("report_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generated_reports_audience", "generated_reports", ["audience"])
    op.create_index("ix_generated_reports_created_at", "generated_reports", ["created_at"])
    op.create_index("ix_generated_reports_listing_id", "generated_reports", ["listing_id"])
    op.create_index("ix_generated_reports_report_format", "generated_reports", ["report_format"])


def downgrade() -> None:
    op.drop_index("ix_generated_reports_report_format", table_name="generated_reports")
    op.drop_index("ix_generated_reports_listing_id", table_name="generated_reports")
    op.drop_index("ix_generated_reports_created_at", table_name="generated_reports")
    op.drop_index("ix_generated_reports_audience", table_name="generated_reports")
    op.drop_table("generated_reports")
