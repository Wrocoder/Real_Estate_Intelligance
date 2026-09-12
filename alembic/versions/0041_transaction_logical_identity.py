"""Index the logical identity shared by RCN transaction versions."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0041_transaction_logical_identity"
down_revision: str | None = "0040_product_analytics_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "transaction_observations",
        sa.Column("logical_transaction_id", sa.String(length=180), nullable=True),
    )
    op.execute(
        """
        UPDATE transaction_observations
        SET logical_transaction_id = CASE
            WHEN source_version IS NOT NULL
             AND right(source_observation_id, length(source_version) + 1)
                 = ':' || source_version
            THEN left(source_observation_id, length(source_observation_id)
                 - length(source_version) - 1)
            ELSE source_observation_id
        END
        """
    )
    op.alter_column("transaction_observations", "logical_transaction_id", nullable=False)
    op.create_index(
        "ix_transaction_observations_source_logical_id",
        "transaction_observations",
        ["source_id", "logical_transaction_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_transaction_observations_source_logical_id",
        table_name="transaction_observations",
    )
    op.drop_column("transaction_observations", "logical_transaction_id")
