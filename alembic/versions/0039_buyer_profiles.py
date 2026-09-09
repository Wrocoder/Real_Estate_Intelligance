"""Add durable buyer profiles."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0039_buyer_profiles"
down_revision: str | None = "0038_rental_observations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "buyer_profiles",
        sa.Column("owner_id", sa.String(length=120), nullable=False),
        sa.Column("intent", sa.String(length=40), nullable=False),
        sa.Column("budget_pln", sa.Integer(), nullable=True),
        sa.Column(
            "priorities",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("owner_id"),
    )


def downgrade() -> None:
    op.drop_table("buyer_profiles")
