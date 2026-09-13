"""Allow RCN transaction monetary totals above the 32-bit integer range."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0042_transaction_money_bigint"
down_revision: str | None = "0041_transaction_logical_identity"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "transaction_observations",
        "property_price_gross",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )
    op.alter_column(
        "transaction_observations",
        "transaction_price_gross",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )
    op.alter_column(
        "transaction_observations",
        "vat_amount",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "transaction_observations",
        "vat_amount",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=True,
    )
    op.alter_column(
        "transaction_observations",
        "transaction_price_gross",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=True,
    )
    op.alter_column(
        "transaction_observations",
        "property_price_gross",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )
