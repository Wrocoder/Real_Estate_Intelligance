"""Add report orders.

Revision ID: 0005_report_orders
Revises: 0004_auth_subscriptions
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_report_orders"
down_revision: str | None = "0004_auth_subscriptions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "report_orders",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("listing_id", sa.String(length=120), nullable=False),
        sa.Column("product_code", sa.String(length=60), nullable=False),
        sa.Column("audience", sa.String(length=40), nullable=False),
        sa.Column("report_format", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("amount_grosz", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("checkout_url", sa.String(length=500), nullable=True),
        sa.Column("generated_report_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("fulfilled_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_orders_audience", "report_orders", ["audience"])
    op.create_index("ix_report_orders_created_at", "report_orders", ["created_at"])
    op.create_index(
        "ix_report_orders_generated_report_id",
        "report_orders",
        ["generated_report_id"],
    )
    op.create_index("ix_report_orders_listing_id", "report_orders", ["listing_id"])
    op.create_index("ix_report_orders_owner_id", "report_orders", ["owner_id"])
    op.create_index("ix_report_orders_product_code", "report_orders", ["product_code"])
    op.create_index("ix_report_orders_status", "report_orders", ["status"])


def downgrade() -> None:
    op.drop_index("ix_report_orders_status", table_name="report_orders")
    op.drop_index("ix_report_orders_product_code", table_name="report_orders")
    op.drop_index("ix_report_orders_owner_id", table_name="report_orders")
    op.drop_index("ix_report_orders_listing_id", table_name="report_orders")
    op.drop_index("ix_report_orders_generated_report_id", table_name="report_orders")
    op.drop_index("ix_report_orders_created_at", table_name="report_orders")
    op.drop_index("ix_report_orders_audience", table_name="report_orders")
    op.drop_table("report_orders")
