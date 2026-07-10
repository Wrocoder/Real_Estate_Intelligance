"""Add auth users and subscriptions.

Revision ID: 0004_auth_subscriptions
Revises: 0003_favorites_alerts
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_auth_subscriptions"
down_revision: str | None = "0003_favorites_alerts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("display_name", sa.String(length=160), nullable=True),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_created_at", "users", ["created_at"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=120), nullable=False),
        sa.Column("plan", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("current_period_start", sa.DateTime(), nullable=True),
        sa.Column("current_period_end", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_subscriptions_created_at", "subscriptions", ["created_at"])
    op.create_index("ix_subscriptions_plan", "subscriptions", ["plan"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])

    op.add_column(
        "generated_reports",
        sa.Column("owner_id", sa.String(length=120), nullable=True),
    )
    op.execute("UPDATE generated_reports SET owner_id = 'demo-user' WHERE owner_id IS NULL")
    op.alter_column("generated_reports", "owner_id", nullable=False)
    op.create_index("ix_generated_reports_owner_id", "generated_reports", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_generated_reports_owner_id", table_name="generated_reports")
    op.drop_column("generated_reports", "owner_id")
    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_status", table_name="subscriptions")
    op.drop_index("ix_subscriptions_plan", table_name="subscriptions")
    op.drop_index("ix_subscriptions_created_at", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_table("users")
