"""Add source retention and data deletion requests.

Revision ID: 0029_source_retention_data_deletion
Revises: 0028_developer_aliases
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0029_source_retention_data_deletion"
down_revision: str | None = "0028_developer_aliases"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "listing_sources",
        sa.Column("raw_payload_retention_days", sa.Integer(), nullable=True),
    )
    op.add_column(
        "listing_sources",
        sa.Column("private_url_retention_days", sa.Integer(), nullable=True),
    )
    op.add_column(
        "listing_sources",
        sa.Column("retention_notes", sa.Text(), nullable=True),
    )

    op.create_table(
        "data_deletion_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("target_type", sa.String(length=60), nullable=False),
        sa.Column("target_id", sa.String(length=200), nullable=False),
        sa.Column("target_owner_id", sa.String(length=120), nullable=True),
        sa.Column("source_name", sa.String(length=120), nullable=True),
        sa.Column("source_url_hash", sa.String(length=128), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("requested_by", sa.String(length=120), nullable=False),
        sa.Column("processed_by", sa.String(length=120), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column(
            "request_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "result_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("action_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_data_deletion_requests_target_type",
        "data_deletion_requests",
        ["target_type"],
    )
    op.create_index(
        "ix_data_deletion_requests_target_id",
        "data_deletion_requests",
        ["target_id"],
    )
    op.create_index(
        "ix_data_deletion_requests_target_owner_id",
        "data_deletion_requests",
        ["target_owner_id"],
    )
    op.create_index(
        "ix_data_deletion_requests_source_name",
        "data_deletion_requests",
        ["source_name"],
    )
    op.create_index(
        "ix_data_deletion_requests_source_url_hash",
        "data_deletion_requests",
        ["source_url_hash"],
    )
    op.create_index("ix_data_deletion_requests_status", "data_deletion_requests", ["status"])
    op.create_index(
        "ix_data_deletion_requests_requested_by",
        "data_deletion_requests",
        ["requested_by"],
    )
    op.create_index(
        "ix_data_deletion_requests_processed_by",
        "data_deletion_requests",
        ["processed_by"],
    )
    op.create_index(
        "ix_data_deletion_requests_created_at",
        "data_deletion_requests",
        ["created_at"],
    )
    op.create_index(
        "ix_data_deletion_requests_processed_at",
        "data_deletion_requests",
        ["processed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_data_deletion_requests_processed_at", table_name="data_deletion_requests")
    op.drop_index("ix_data_deletion_requests_created_at", table_name="data_deletion_requests")
    op.drop_index("ix_data_deletion_requests_processed_by", table_name="data_deletion_requests")
    op.drop_index("ix_data_deletion_requests_requested_by", table_name="data_deletion_requests")
    op.drop_index("ix_data_deletion_requests_status", table_name="data_deletion_requests")
    op.drop_index(
        "ix_data_deletion_requests_source_url_hash",
        table_name="data_deletion_requests",
    )
    op.drop_index("ix_data_deletion_requests_source_name", table_name="data_deletion_requests")
    op.drop_index(
        "ix_data_deletion_requests_target_owner_id",
        table_name="data_deletion_requests",
    )
    op.drop_index("ix_data_deletion_requests_target_id", table_name="data_deletion_requests")
    op.drop_index("ix_data_deletion_requests_target_type", table_name="data_deletion_requests")
    op.drop_table("data_deletion_requests")

    op.drop_column("listing_sources", "retention_notes")
    op.drop_column("listing_sources", "private_url_retention_days")
    op.drop_column("listing_sources", "raw_payload_retention_days")
