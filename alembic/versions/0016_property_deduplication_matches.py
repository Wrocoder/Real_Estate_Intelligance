"""Add property deduplication matches.

Revision ID: 0016_property_deduplication_matches
Revises: 0015_listing_events
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0016_property_deduplication_matches"
down_revision: str | None = "0015_listing_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "property_deduplication_matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=True),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("source_name", sa.String(length=120), nullable=False),
        sa.Column("source_listing_id", sa.String(length=120), nullable=False),
        sa.Column("candidate_property_id", sa.Integer(), nullable=True),
        sa.Column("matched_property_id", sa.Integer(), nullable=True),
        sa.Column("decision", sa.String(length=40), nullable=False),
        sa.Column("review_status", sa.String(length=40), nullable=False),
        sa.Column("match_score", sa.Integer(), nullable=False),
        sa.Column("reasons_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("incoming_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("candidate_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["candidate_property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["job_id"], ["ingestion_jobs.id"]),
        sa.ForeignKeyConstraint(["matched_property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["source_id"], ["listing_sources.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_property_deduplication_matches_created_at",
        "property_deduplication_matches",
        ["created_at"],
    )
    op.create_index(
        "ix_property_deduplication_matches_decision",
        "property_deduplication_matches",
        ["decision"],
    )
    op.create_index(
        "ix_property_deduplication_matches_job_id",
        "property_deduplication_matches",
        ["job_id"],
    )
    op.create_index(
        "ix_property_deduplication_matches_review_status",
        "property_deduplication_matches",
        ["review_status"],
    )
    op.create_index(
        "ix_property_deduplication_matches_source_listing_id",
        "property_deduplication_matches",
        ["source_listing_id"],
    )
    op.create_index(
        "ix_property_deduplication_matches_source_name",
        "property_deduplication_matches",
        ["source_name"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_property_deduplication_matches_source_name",
        table_name="property_deduplication_matches",
    )
    op.drop_index(
        "ix_property_deduplication_matches_source_listing_id",
        table_name="property_deduplication_matches",
    )
    op.drop_index(
        "ix_property_deduplication_matches_review_status",
        table_name="property_deduplication_matches",
    )
    op.drop_index(
        "ix_property_deduplication_matches_job_id",
        table_name="property_deduplication_matches",
    )
    op.drop_index(
        "ix_property_deduplication_matches_decision",
        table_name="property_deduplication_matches",
    )
    op.drop_index(
        "ix_property_deduplication_matches_created_at",
        table_name="property_deduplication_matches",
    )
    op.drop_table("property_deduplication_matches")
