"""Add report order billing details.

Revision ID: 0021_report_order_billing_details
Revises: 0020_source_checks_errors
Create Date: 2026-07-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0021_report_order_billing_details"
down_revision: str | None = "0020_source_checks_errors"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "report_orders",
        sa.Column(
            "billing_details_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )
    op.alter_column("report_orders", "billing_details_json", server_default=None)


def downgrade() -> None:
    op.drop_column("report_orders", "billing_details_json")
