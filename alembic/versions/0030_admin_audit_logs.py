"""Add admin audit logs.

Revision ID: 0030_admin_audit_logs
Revises: 0029_source_retention_data_deletion
Create Date: 2026-07-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0030_admin_audit_logs"
down_revision: str | None = "0029_source_retention_data_deletion"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("action_type", sa.String(length=120), nullable=False),
        sa.Column("actor_id", sa.String(length=120), nullable=False),
        sa.Column("actor_role", sa.String(length=40), nullable=False),
        sa.Column("resource_type", sa.String(length=80), nullable=False),
        sa.Column("resource_id", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_logs_action_type", "admin_audit_logs", ["action_type"])
    op.create_index("ix_admin_audit_logs_actor_id", "admin_audit_logs", ["actor_id"])
    op.create_index("ix_admin_audit_logs_actor_role", "admin_audit_logs", ["actor_role"])
    op.create_index("ix_admin_audit_logs_resource_type", "admin_audit_logs", ["resource_type"])
    op.create_index("ix_admin_audit_logs_resource_id", "admin_audit_logs", ["resource_id"])
    op.create_index("ix_admin_audit_logs_status", "admin_audit_logs", ["status"])
    op.create_index("ix_admin_audit_logs_created_at", "admin_audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_created_at", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_status", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_resource_id", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_resource_type", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_actor_role", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_actor_id", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_action_type", table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
