"""Add privacy-bounded product funnel events."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0040_product_analytics_events"
down_revision: str | None = "0039_buyer_profiles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_analytics_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("journey_id", sa.String(length=36), nullable=False),
        sa.Column("event_name", sa.String(length=80), nullable=False),
        sa.Column("schema_version", sa.String(length=12), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column(
            "properties_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_product_analytics_events_journey_id",
        "product_analytics_events",
        ["journey_id"],
    )
    op.create_index(
        "ix_product_analytics_events_event_name",
        "product_analytics_events",
        ["event_name"],
    )
    op.create_index(
        "ix_product_analytics_events_locale",
        "product_analytics_events",
        ["locale"],
    )
    op.create_index(
        "ix_product_analytics_events_created_at",
        "product_analytics_events",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_product_analytics_events_created_at", table_name="product_analytics_events")
    op.drop_index("ix_product_analytics_events_locale", table_name="product_analytics_events")
    op.drop_index("ix_product_analytics_events_event_name", table_name="product_analytics_events")
    op.drop_index("ix_product_analytics_events_journey_id", table_name="product_analytics_events")
    op.drop_table("product_analytics_events")
