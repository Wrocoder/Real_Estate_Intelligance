"""Add developer reputation tables.

Revision ID: 0026_developer_reputation_tables
Revises: 0025_listing_full_text_indexes
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0026_developer_reputation_tables"
down_revision: str | None = "0025_listing_full_text_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "developer_profiles",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("legal_name", sa.String(length=200), nullable=True),
        sa.Column("brand_names_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("krs", sa.String(length=32), nullable=True),
        sa.Column("nip", sa.String(length=32), nullable=True),
        sa.Column("regon", sa.String(length=32), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("headquarters_city", sa.String(length=120), nullable=True),
        sa.Column("founded_year", sa.Integer(), nullable=True),
        sa.Column("source_names_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_developer_profiles_name", "developer_profiles", ["name"])
    op.create_index("ix_developer_profiles_legal_name", "developer_profiles", ["legal_name"])
    op.create_index("ix_developer_profiles_krs", "developer_profiles", ["krs"])
    op.create_index("ix_developer_profiles_nip", "developer_profiles", ["nip"])
    op.create_index("ix_developer_profiles_regon", "developer_profiles", ["regon"])
    op.create_index(
        "ix_developer_profiles_headquarters_city",
        "developer_profiles",
        ["headquarters_city"],
    )
    op.create_index("ix_developer_profiles_updated_at", "developer_profiles", ["updated_at"])

    op.create_table(
        "developer_projects",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("developer_id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("units_count", sa.Integer(), nullable=True),
        sa.Column("completed_year", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["developer_id"], ["developer_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_developer_projects_developer_id", "developer_projects", ["developer_id"])
    op.create_index("ix_developer_projects_name", "developer_projects", ["name"])
    op.create_index("ix_developer_projects_city", "developer_projects", ["city"])
    op.create_index("ix_developer_projects_district", "developer_projects", ["district"])
    op.create_index("ix_developer_projects_status", "developer_projects", ["status"])

    op.create_table(
        "developer_quality_signals",
        sa.Column("id", sa.String(length=180), nullable=False),
        sa.Column("developer_id", sa.String(length=120), nullable=False),
        sa.Column("signal_type", sa.String(length=60), nullable=False),
        sa.Column("severity", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("source_name", sa.String(length=160), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("observed_at", sa.DateTime(), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["developer_id"], ["developer_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_developer_quality_signals_developer_id",
        "developer_quality_signals",
        ["developer_id"],
    )
    op.create_index(
        "ix_developer_quality_signals_signal_type",
        "developer_quality_signals",
        ["signal_type"],
    )
    op.create_index(
        "ix_developer_quality_signals_severity",
        "developer_quality_signals",
        ["severity"],
    )
    op.create_index(
        "ix_developer_quality_signals_source_name",
        "developer_quality_signals",
        ["source_name"],
    )
    op.create_index(
        "ix_developer_quality_signals_observed_at",
        "developer_quality_signals",
        ["observed_at"],
    )

    op.create_table(
        "developer_reputation_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("developer_id", sa.String(length=120), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
        sa.Column("reputation_score", sa.Integer(), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=40), nullable=False),
        sa.Column("score_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["developer_id"], ["developer_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_developer_reputation_snapshots_developer_id",
        "developer_reputation_snapshots",
        ["developer_id"],
    )
    op.create_index(
        "ix_developer_reputation_snapshots_calculated_at",
        "developer_reputation_snapshots",
        ["calculated_at"],
    )
    op.create_index(
        "ix_developer_reputation_snapshots_label",
        "developer_reputation_snapshots",
        ["label"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_developer_reputation_snapshots_label",
        table_name="developer_reputation_snapshots",
    )
    op.drop_index(
        "ix_developer_reputation_snapshots_calculated_at",
        table_name="developer_reputation_snapshots",
    )
    op.drop_index(
        "ix_developer_reputation_snapshots_developer_id",
        table_name="developer_reputation_snapshots",
    )
    op.drop_table("developer_reputation_snapshots")
    op.drop_index(
        "ix_developer_quality_signals_observed_at",
        table_name="developer_quality_signals",
    )
    op.drop_index(
        "ix_developer_quality_signals_source_name",
        table_name="developer_quality_signals",
    )
    op.drop_index(
        "ix_developer_quality_signals_severity",
        table_name="developer_quality_signals",
    )
    op.drop_index(
        "ix_developer_quality_signals_signal_type",
        table_name="developer_quality_signals",
    )
    op.drop_index(
        "ix_developer_quality_signals_developer_id",
        table_name="developer_quality_signals",
    )
    op.drop_table("developer_quality_signals")
    op.drop_index("ix_developer_projects_status", table_name="developer_projects")
    op.drop_index("ix_developer_projects_district", table_name="developer_projects")
    op.drop_index("ix_developer_projects_city", table_name="developer_projects")
    op.drop_index("ix_developer_projects_name", table_name="developer_projects")
    op.drop_index("ix_developer_projects_developer_id", table_name="developer_projects")
    op.drop_table("developer_projects")
    op.drop_index("ix_developer_profiles_updated_at", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_headquarters_city", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_regon", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_nip", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_krs", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_legal_name", table_name="developer_profiles")
    op.drop_index("ix_developer_profiles_name", table_name="developer_profiles")
    op.drop_table("developer_profiles")
