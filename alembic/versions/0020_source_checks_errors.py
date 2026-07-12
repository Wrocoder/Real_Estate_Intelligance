"""Add source check jobs and source errors.

Revision ID: 0020_source_checks_errors
Revises: 0019_ai_insights
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0020_source_checks_errors"
down_revision: str | None = "0019_ai_insights"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "source_check_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("source_name", sa.String(length=120), nullable=False),
        sa.Column("source_type", sa.String(length=60), nullable=False),
        sa.Column("check_type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("target_domain", sa.String(length=255), nullable=True),
        sa.Column("target_url_hash", sa.String(length=128), nullable=True),
        sa.Column("created_by", sa.String(length=120), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_source_check_jobs_check_type", "source_check_jobs", ["check_type"])
    op.create_index("ix_source_check_jobs_created_at", "source_check_jobs", ["created_at"])
    op.create_index("ix_source_check_jobs_created_by", "source_check_jobs", ["created_by"])
    op.create_index("ix_source_check_jobs_scheduled_for", "source_check_jobs", ["scheduled_for"])
    op.create_index("ix_source_check_jobs_source_id", "source_check_jobs", ["source_id"])
    op.create_index("ix_source_check_jobs_source_name", "source_check_jobs", ["source_name"])
    op.create_index("ix_source_check_jobs_source_type", "source_check_jobs", ["source_type"])
    op.create_index("ix_source_check_jobs_status", "source_check_jobs", ["status"])
    op.create_index("ix_source_check_jobs_target_domain", "source_check_jobs", ["target_domain"])
    op.create_index(
        "ix_source_check_jobs_target_url_hash",
        "source_check_jobs",
        ["target_url_hash"],
    )

    op.create_table(
        "source_errors",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("source_name", sa.String(length=120), nullable=False),
        sa.Column("source_type", sa.String(length=60), nullable=False),
        sa.Column("source_check_job_id", sa.String(length=36), nullable=True),
        sa.Column("ingestion_job_id", sa.String(length=36), nullable=True),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("error_code", sa.String(length=100), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("retryable", sa.Boolean(), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("next_retry_at", sa.DateTime(), nullable=True),
        sa.Column("last_retry_job_id", sa.String(length=36), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_by", sa.String(length=120), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["ingestion_job_id"], ["ingestion_jobs.id"]),
        sa.ForeignKeyConstraint(["last_retry_job_id"], ["source_check_jobs.id"]),
        sa.ForeignKeyConstraint(["source_check_job_id"], ["source_check_jobs.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_source_errors_created_at", "source_errors", ["created_at"])
    op.create_index("ix_source_errors_error_code", "source_errors", ["error_code"])
    op.create_index("ix_source_errors_ingestion_job_id", "source_errors", ["ingestion_job_id"])
    op.create_index("ix_source_errors_last_retry_job_id", "source_errors", ["last_retry_job_id"])
    op.create_index("ix_source_errors_next_retry_at", "source_errors", ["next_retry_at"])
    op.create_index("ix_source_errors_resolved_at", "source_errors", ["resolved_at"])
    op.create_index("ix_source_errors_resolved_by", "source_errors", ["resolved_by"])
    op.create_index("ix_source_errors_retryable", "source_errors", ["retryable"])
    op.create_index("ix_source_errors_severity", "source_errors", ["severity"])
    op.create_index(
        "ix_source_errors_source_check_job_id",
        "source_errors",
        ["source_check_job_id"],
    )
    op.create_index("ix_source_errors_source_id", "source_errors", ["source_id"])
    op.create_index("ix_source_errors_source_name", "source_errors", ["source_name"])
    op.create_index("ix_source_errors_source_type", "source_errors", ["source_type"])
    op.create_index("ix_source_errors_status", "source_errors", ["status"])


def downgrade() -> None:
    op.drop_index("ix_source_errors_status", table_name="source_errors")
    op.drop_index("ix_source_errors_source_type", table_name="source_errors")
    op.drop_index("ix_source_errors_source_name", table_name="source_errors")
    op.drop_index("ix_source_errors_source_id", table_name="source_errors")
    op.drop_index("ix_source_errors_source_check_job_id", table_name="source_errors")
    op.drop_index("ix_source_errors_severity", table_name="source_errors")
    op.drop_index("ix_source_errors_retryable", table_name="source_errors")
    op.drop_index("ix_source_errors_resolved_by", table_name="source_errors")
    op.drop_index("ix_source_errors_resolved_at", table_name="source_errors")
    op.drop_index("ix_source_errors_next_retry_at", table_name="source_errors")
    op.drop_index("ix_source_errors_last_retry_job_id", table_name="source_errors")
    op.drop_index("ix_source_errors_ingestion_job_id", table_name="source_errors")
    op.drop_index("ix_source_errors_error_code", table_name="source_errors")
    op.drop_index("ix_source_errors_created_at", table_name="source_errors")
    op.drop_table("source_errors")

    op.drop_index("ix_source_check_jobs_target_url_hash", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_target_domain", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_status", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_source_type", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_source_name", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_source_id", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_scheduled_for", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_created_by", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_created_at", table_name="source_check_jobs")
    op.drop_index("ix_source_check_jobs_check_type", table_name="source_check_jobs")
    op.drop_table("source_check_jobs")
