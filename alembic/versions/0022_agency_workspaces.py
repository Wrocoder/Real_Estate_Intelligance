"""Add agency workspaces.

Revision ID: 0022_agency_workspaces
Revises: 0021_report_order_billing_details
Create Date: 2026-07-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0022_agency_workspaces"
down_revision: str | None = "0021_report_order_billing_details"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "agencies",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("billing_email", sa.String(length=160), nullable=True),
        sa.Column("website_url", sa.String(length=240), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agencies_billing_email", "agencies", ["billing_email"])
    op.create_index("ix_agencies_city", "agencies", ["city"])
    op.create_index("ix_agencies_created_at", "agencies", ["created_at"])
    op.create_index("ix_agencies_name", "agencies", ["name"])
    op.create_index("ix_agencies_owner_id", "agencies", ["owner_id"])

    op.create_table(
        "agency_memberships",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("agency_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=True),
        sa.Column("display_name", sa.String(length=160), nullable=True),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("invited_by", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["agency_id"], ["agencies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("agency_id", "user_id"),
    )
    op.create_index("ix_agency_memberships_agency_id", "agency_memberships", ["agency_id"])
    op.create_index("ix_agency_memberships_created_at", "agency_memberships", ["created_at"])
    op.create_index("ix_agency_memberships_email", "agency_memberships", ["email"])
    op.create_index("ix_agency_memberships_invited_by", "agency_memberships", ["invited_by"])
    op.create_index("ix_agency_memberships_role", "agency_memberships", ["role"])
    op.create_index("ix_agency_memberships_status", "agency_memberships", ["status"])
    op.create_index("ix_agency_memberships_user_id", "agency_memberships", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_agency_memberships_user_id", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_status", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_role", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_invited_by", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_email", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_created_at", table_name="agency_memberships")
    op.drop_index("ix_agency_memberships_agency_id", table_name="agency_memberships")
    op.drop_table("agency_memberships")

    op.drop_index("ix_agencies_owner_id", table_name="agencies")
    op.drop_index("ix_agencies_name", table_name="agencies")
    op.drop_index("ix_agencies_created_at", table_name="agencies")
    op.drop_index("ix_agencies_city", table_name="agencies")
    op.drop_index("ix_agencies_billing_email", table_name="agencies")
    op.drop_table("agencies")
