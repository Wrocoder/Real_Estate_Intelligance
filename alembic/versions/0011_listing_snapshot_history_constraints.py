"""Add listing snapshot history constraints.

Revision ID: 0011_listing_snapshot_history_constraints
Revises: 0010_source_registry_metadata
Create Date: 2026-07-11
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0011_listing_snapshot_history_constraints"
down_revision: str | None = "0010_source_registry_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_listing_snapshots_property_source_observed_at",
        "listing_snapshots",
        ["property_source_id", "observed_at"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_listing_snapshots_property_source_observed_at",
        "listing_snapshots",
        type_="unique",
    )
