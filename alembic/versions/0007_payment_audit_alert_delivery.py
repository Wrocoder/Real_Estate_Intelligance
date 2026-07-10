"""Add paid report audit and alert delivery jobs.

Revision ID: 0007_paid_audit_alerts
Revises: 0006_ingestion_admin
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0007_paid_audit_alerts"
down_revision: str | None = "0006_ingestion_admin"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "user_alerts",
        sa.Column("delivery_target", sa.String(length=255), nullable=True),
    )

    op.create_table(
        "report_order_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("order_id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("actor_id", sa.String(length=120), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["report_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_order_events_actor_id", "report_order_events", ["actor_id"])
    op.create_index("ix_report_order_events_created_at", "report_order_events", ["created_at"])
    op.create_index("ix_report_order_events_event_type", "report_order_events", ["event_type"])
    op.create_index("ix_report_order_events_order_id", "report_order_events", ["order_id"])
    op.create_index("ix_report_order_events_owner_id", "report_order_events", ["owner_id"])

    op.create_table(
        "alert_delivery_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("alert_id", sa.String(length=36), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("total_matches", sa.Integer(), nullable=False),
        sa.Column("delivered_count", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("listing_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["alert_id"], ["user_alerts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alert_delivery_jobs_alert_id", "alert_delivery_jobs", ["alert_id"])
    op.create_index("ix_alert_delivery_jobs_channel", "alert_delivery_jobs", ["channel"])
    op.create_index("ix_alert_delivery_jobs_created_at", "alert_delivery_jobs", ["created_at"])
    op.create_index("ix_alert_delivery_jobs_owner_id", "alert_delivery_jobs", ["owner_id"])
    op.create_index("ix_alert_delivery_jobs_provider", "alert_delivery_jobs", ["provider"])
    op.create_index("ix_alert_delivery_jobs_status", "alert_delivery_jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_alert_delivery_jobs_status", table_name="alert_delivery_jobs")
    op.drop_index("ix_alert_delivery_jobs_provider", table_name="alert_delivery_jobs")
    op.drop_index("ix_alert_delivery_jobs_owner_id", table_name="alert_delivery_jobs")
    op.drop_index("ix_alert_delivery_jobs_created_at", table_name="alert_delivery_jobs")
    op.drop_index("ix_alert_delivery_jobs_channel", table_name="alert_delivery_jobs")
    op.drop_index("ix_alert_delivery_jobs_alert_id", table_name="alert_delivery_jobs")
    op.drop_table("alert_delivery_jobs")

    op.drop_index("ix_report_order_events_owner_id", table_name="report_order_events")
    op.drop_index("ix_report_order_events_order_id", table_name="report_order_events")
    op.drop_index("ix_report_order_events_event_type", table_name="report_order_events")
    op.drop_index("ix_report_order_events_created_at", table_name="report_order_events")
    op.drop_index("ix_report_order_events_actor_id", table_name="report_order_events")
    op.drop_table("report_order_events")

    op.drop_column("user_alerts", "delivery_target")
