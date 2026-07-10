"""Add payment webhook events.

Revision ID: 0008_payment_webhooks
Revises: 0007_paid_audit_alerts
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0008_payment_webhooks"
down_revision: str | None = "0007_paid_audit_alerts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "payment_webhook_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("provider_event_id", sa.String(length=160), nullable=False),
        sa.Column("order_id", sa.String(length=36), nullable=True),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("payload_hash", sa.String(length=128), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_event_id"),
    )
    op.create_index(
        "ix_payment_webhook_events_created_at",
        "payment_webhook_events",
        ["created_at"],
    )
    op.create_index(
        "ix_payment_webhook_events_event_type",
        "payment_webhook_events",
        ["event_type"],
    )
    op.create_index("ix_payment_webhook_events_order_id", "payment_webhook_events", ["order_id"])
    op.create_index(
        "ix_payment_webhook_events_payload_hash",
        "payment_webhook_events",
        ["payload_hash"],
    )
    op.create_index("ix_payment_webhook_events_provider", "payment_webhook_events", ["provider"])
    op.create_index(
        "ix_payment_webhook_events_provider_event_id",
        "payment_webhook_events",
        ["provider_event_id"],
    )
    op.create_index("ix_payment_webhook_events_status", "payment_webhook_events", ["status"])


def downgrade() -> None:
    op.drop_index("ix_payment_webhook_events_status", table_name="payment_webhook_events")
    op.drop_index(
        "ix_payment_webhook_events_provider_event_id",
        table_name="payment_webhook_events",
    )
    op.drop_index("ix_payment_webhook_events_provider", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_payload_hash", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_order_id", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_event_type", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_created_at", table_name="payment_webhook_events")
    op.drop_table("payment_webhook_events")
