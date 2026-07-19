"""Add developer signal moderation fields.

Revision ID: 0031_developer_signal_moderation
Revises: 0030_admin_audit_logs
Create Date: 2026-07-19
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0031_developer_signal_moderation"
down_revision: str | None = "0030_admin_audit_logs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "developer_quality_signals",
        sa.Column(
            "moderation_status",
            sa.String(length=40),
            nullable=False,
            server_default="active",
        ),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column(
            "dispute_status",
            sa.String(length=40),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column("moderation_note", sa.Text(), nullable=True),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column("disputed_by", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column("disputed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "developer_quality_signals",
        sa.Column("reviewed_by", sa.String(length=120), nullable=True),
    )
    op.create_index(
        "ix_developer_quality_signals_moderation_status",
        "developer_quality_signals",
        ["moderation_status"],
    )
    op.create_index(
        "ix_developer_quality_signals_dispute_status",
        "developer_quality_signals",
        ["dispute_status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_developer_quality_signals_dispute_status",
        table_name="developer_quality_signals",
    )
    op.drop_index(
        "ix_developer_quality_signals_moderation_status",
        table_name="developer_quality_signals",
    )
    op.drop_column("developer_quality_signals", "reviewed_by")
    op.drop_column("developer_quality_signals", "resolved_at")
    op.drop_column("developer_quality_signals", "disputed_at")
    op.drop_column("developer_quality_signals", "disputed_by")
    op.drop_column("developer_quality_signals", "moderation_note")
    op.drop_column("developer_quality_signals", "dispute_status")
    op.drop_column("developer_quality_signals", "moderation_status")
