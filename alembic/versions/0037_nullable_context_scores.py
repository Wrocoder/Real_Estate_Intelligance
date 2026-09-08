"""Allow unavailable contextual property scores to remain null."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0037_nullable_context_scores"
down_revision: str | None = "0036_area_transaction_history"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "property_scores",
        "liquidity_score",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.alter_column(
        "property_scores",
        "rental_potential_score",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    # These rows are derived analytics and must be recalculated by the older code.
    op.execute(
        "DELETE FROM property_scores "
        "WHERE liquidity_score IS NULL OR rental_potential_score IS NULL"
    )
    op.alter_column(
        "property_scores",
        "rental_potential_score",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.alter_column(
        "property_scores",
        "liquidity_score",
        existing_type=sa.Integer(),
        nullable=False,
    )
