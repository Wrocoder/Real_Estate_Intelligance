"""Add AI insights table.

Revision ID: 0019_ai_insights
Revises: 0018_infrastructure_reference_tables
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0019_ai_insights"
down_revision: str | None = "0018_infrastructure_reference_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_insights",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("subject_type", sa.String(length=60), nullable=False),
        sa.Column("subject_id", sa.String(length=160), nullable=False),
        sa.Column("insight_type", sa.String(length=80), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model_name", sa.String(length=120), nullable=False),
        sa.Column("prompt_version", sa.String(length=120), nullable=False),
        sa.Column("source_report_id", sa.String(length=36), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("input_hash", sa.String(length=128), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["source_report_id"], ["generated_reports.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_report_id",
            "insight_type",
            "input_hash",
            name="uq_ai_insights_report_type_hash",
        ),
    )
    op.create_index("ix_ai_insights_created_at", "ai_insights", ["created_at"])
    op.create_index("ix_ai_insights_input_hash", "ai_insights", ["input_hash"])
    op.create_index("ix_ai_insights_insight_type", "ai_insights", ["insight_type"])
    op.create_index("ix_ai_insights_owner_id", "ai_insights", ["owner_id"])
    op.create_index("ix_ai_insights_source_report_id", "ai_insights", ["source_report_id"])
    op.create_index("ix_ai_insights_subject_id", "ai_insights", ["subject_id"])
    op.create_index("ix_ai_insights_subject_type", "ai_insights", ["subject_type"])


def downgrade() -> None:
    op.drop_index("ix_ai_insights_subject_type", table_name="ai_insights")
    op.drop_index("ix_ai_insights_subject_id", table_name="ai_insights")
    op.drop_index("ix_ai_insights_source_report_id", table_name="ai_insights")
    op.drop_index("ix_ai_insights_owner_id", table_name="ai_insights")
    op.drop_index("ix_ai_insights_insight_type", table_name="ai_insights")
    op.drop_index("ix_ai_insights_input_hash", table_name="ai_insights")
    op.drop_index("ix_ai_insights_created_at", table_name="ai_insights")
    op.drop_table("ai_insights")
