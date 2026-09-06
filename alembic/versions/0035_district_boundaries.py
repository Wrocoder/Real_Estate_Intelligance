"""Store authoritative district polygons for spatial transaction assignment."""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0035_district_boundaries"
down_revision: str | None = "0034_transaction_observations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "district_boundaries",
        sa.Column("id", sa.String(length=160), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=False),
        sa.Column("district", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("source_name", sa.String(length=160), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("source_crs", sa.Integer(), nullable=False),
        sa.Column("geometry_wkt", sa.Text(), nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("city", "slug", name="uq_district_boundaries_city_slug"),
    )
    op.create_index("ix_district_boundaries_city", "district_boundaries", ["city"])
    op.create_index("ix_district_boundaries_district", "district_boundaries", ["district"])
    op.create_index("ix_district_boundaries_slug", "district_boundaries", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_district_boundaries_slug", table_name="district_boundaries")
    op.drop_index("ix_district_boundaries_district", table_name="district_boundaries")
    op.drop_index("ix_district_boundaries_city", table_name="district_boundaries")
    op.drop_table("district_boundaries")
