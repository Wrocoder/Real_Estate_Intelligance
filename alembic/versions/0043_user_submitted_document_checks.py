"""Add owner-scoped checks for user-submitted documents."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0043_user_submitted_document_checks"
down_revision: str | None = "0042_transaction_money_bigint"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_submitted_document_checks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("draft_id", sa.String(length=36), nullable=False),
        sa.Column("document_type", sa.String(length=60), nullable=False),
        sa.Column("upload_channel", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("source_hash", sa.String(length=128), nullable=False),
        sa.Column("signals_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("unknowns_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("conflicts_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False),
        sa.Column("retention_deadline", sa.DateTime(), nullable=False),
        sa.Column("raw_document_retained", sa.Boolean(), nullable=False),
        sa.Column("disclaimer", sa.Text(), nullable=False),
        sa.Column("deleted", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["draft_id"], ["user_submitted_listing_drafts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_created_at"),
        "user_submitted_document_checks",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_deleted"),
        "user_submitted_document_checks",
        ["deleted"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_document_type"),
        "user_submitted_document_checks",
        ["document_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_draft_id"),
        "user_submitted_document_checks",
        ["draft_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_owner_id"),
        "user_submitted_document_checks",
        ["owner_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_retention_deadline"),
        "user_submitted_document_checks",
        ["retention_deadline"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_source_hash"),
        "user_submitted_document_checks",
        ["source_hash"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_status"),
        "user_submitted_document_checks",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_submitted_document_checks_upload_channel"),
        "user_submitted_document_checks",
        ["upload_channel"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_user_submitted_document_checks_upload_channel"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_status"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_source_hash"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_retention_deadline"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_owner_id"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_draft_id"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_document_type"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_deleted"),
        table_name="user_submitted_document_checks",
    )
    op.drop_index(
        op.f("ix_user_submitted_document_checks_created_at"),
        table_name="user_submitted_document_checks",
    )
    op.drop_table("user_submitted_document_checks")
