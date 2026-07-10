"""Add ingestion admin tables.

Revision ID: 0006_ingestion_admin
Revises: 0005_report_orders
Create Date: 2026-07-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0006_ingestion_admin"
down_revision: str | None = "0005_report_orders"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ingestion_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_name", sa.String(length=120), nullable=False),
        sa.Column("source_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("rows_seen", sa.Integer(), nullable=False),
        sa.Column("raw_created", sa.Integer(), nullable=False),
        sa.Column("raw_updated", sa.Integer(), nullable=False),
        sa.Column("properties_created", sa.Integer(), nullable=False),
        sa.Column("properties_updated", sa.Integer(), nullable=False),
        sa.Column("snapshots_created", sa.Integer(), nullable=False),
        sa.Column("snapshots_updated", sa.Integer(), nullable=False),
        sa.Column("errors_count", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=120), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ingestion_jobs_created_at", "ingestion_jobs", ["created_at"])
    op.create_index("ix_ingestion_jobs_created_by", "ingestion_jobs", ["created_by"])
    op.create_index("ix_ingestion_jobs_source_name", "ingestion_jobs", ["source_name"])
    op.create_index("ix_ingestion_jobs_source_type", "ingestion_jobs", ["source_type"])
    op.create_index("ix_ingestion_jobs_status", "ingestion_jobs", ["status"])

    op.create_table(
        "data_quality_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=True),
        sa.Column("source_name", sa.String(length=120), nullable=False),
        sa.Column("source_listing_id", sa.String(length=120), nullable=True),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["ingestion_jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_data_quality_logs_code", "data_quality_logs", ["code"])
    op.create_index("ix_data_quality_logs_created_at", "data_quality_logs", ["created_at"])
    op.create_index("ix_data_quality_logs_job_id", "data_quality_logs", ["job_id"])
    op.create_index("ix_data_quality_logs_severity", "data_quality_logs", ["severity"])
    op.create_index(
        "ix_data_quality_logs_source_listing_id",
        "data_quality_logs",
        ["source_listing_id"],
    )
    op.create_index("ix_data_quality_logs_source_name", "data_quality_logs", ["source_name"])


def downgrade() -> None:
    op.drop_index("ix_data_quality_logs_source_name", table_name="data_quality_logs")
    op.drop_index("ix_data_quality_logs_source_listing_id", table_name="data_quality_logs")
    op.drop_index("ix_data_quality_logs_severity", table_name="data_quality_logs")
    op.drop_index("ix_data_quality_logs_job_id", table_name="data_quality_logs")
    op.drop_index("ix_data_quality_logs_created_at", table_name="data_quality_logs")
    op.drop_index("ix_data_quality_logs_code", table_name="data_quality_logs")
    op.drop_table("data_quality_logs")

    op.drop_index("ix_ingestion_jobs_status", table_name="ingestion_jobs")
    op.drop_index("ix_ingestion_jobs_source_type", table_name="ingestion_jobs")
    op.drop_index("ix_ingestion_jobs_source_name", table_name="ingestion_jobs")
    op.drop_index("ix_ingestion_jobs_created_by", table_name="ingestion_jobs")
    op.drop_index("ix_ingestion_jobs_created_at", table_name="ingestion_jobs")
    op.drop_table("ingestion_jobs")
