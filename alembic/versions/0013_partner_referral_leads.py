"""Add partner referral leads.

Revision ID: 0013_partner_referral_leads
Revises: 0012_user_submitted_listing_drafts
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0013_partner_referral_leads"
down_revision: str | None = "0012_user_submitted_listing_drafts"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partner_referral_leads",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("referral_type", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("source_context", sa.String(length=120), nullable=False),
        sa.Column("listing_id", sa.String(length=120), nullable=True),
        sa.Column("report_id", sa.String(length=120), nullable=True),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=True),
        sa.Column("contact_name", sa.String(length=160), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=80), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("consent_to_contact", sa.Boolean(), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("assigned_to", sa.String(length=120), nullable=True),
        sa.Column("partner_name", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_partner_referral_leads_assigned_to",
        "partner_referral_leads",
        ["assigned_to"],
    )
    op.create_index("ix_partner_referral_leads_city", "partner_referral_leads", ["city"])
    op.create_index(
        "ix_partner_referral_leads_contact_email",
        "partner_referral_leads",
        ["contact_email"],
    )
    op.create_index(
        "ix_partner_referral_leads_created_at",
        "partner_referral_leads",
        ["created_at"],
    )
    op.create_index("ix_partner_referral_leads_district", "partner_referral_leads", ["district"])
    op.create_index(
        "ix_partner_referral_leads_listing_id",
        "partner_referral_leads",
        ["listing_id"],
    )
    op.create_index("ix_partner_referral_leads_owner_id", "partner_referral_leads", ["owner_id"])
    op.create_index(
        "ix_partner_referral_leads_referral_type",
        "partner_referral_leads",
        ["referral_type"],
    )
    op.create_index("ix_partner_referral_leads_report_id", "partner_referral_leads", ["report_id"])
    op.create_index(
        "ix_partner_referral_leads_source_context",
        "partner_referral_leads",
        ["source_context"],
    )
    op.create_index("ix_partner_referral_leads_status", "partner_referral_leads", ["status"])


def downgrade() -> None:
    op.drop_index("ix_partner_referral_leads_status", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_source_context", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_report_id", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_referral_type", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_owner_id", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_listing_id", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_district", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_created_at", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_contact_email", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_city", table_name="partner_referral_leads")
    op.drop_index("ix_partner_referral_leads_assigned_to", table_name="partner_referral_leads")
    op.drop_table("partner_referral_leads")
