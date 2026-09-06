"""Add materialized transaction price history to area statistics."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0036_area_transaction_history"
down_revision: str | None = "0035_district_boundaries"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "area_statistics",
        sa.Column(
            "transaction_history_observation_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "area_statistics",
        sa.Column("transaction_history_observed_from", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "area_statistics",
        sa.Column("transaction_history_observed_to", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "area_statistics",
        sa.Column(
            "transaction_monthly_history_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "area_statistics",
        sa.Column(
            "transaction_yearly_history_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    for column in (
        "transaction_history_observation_count",
        "transaction_monthly_history_json",
        "transaction_yearly_history_json",
    ):
        op.alter_column("area_statistics", column, server_default=None)


def downgrade() -> None:
    for column in (
        "transaction_yearly_history_json",
        "transaction_monthly_history_json",
        "transaction_history_observed_to",
        "transaction_history_observed_from",
        "transaction_history_observation_count",
    ):
        op.drop_column("area_statistics", column)
