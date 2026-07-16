"""Add listing developer metadata fields.

Revision ID: 0027_listing_developer_metadata
Revises: 0026_developer_reputation_tables
Create Date: 2026-07-16
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0027_listing_developer_metadata"
down_revision: str | None = "0026_developer_reputation_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_SEARCH_TRANSLATE_FROM = (
    "\u0105\u0107\u0119\u0142\u0144\u00f3\u015b\u017a\u017c"
    "\u0104\u0106\u0118\u0141\u0143\u00d3\u015a\u0179\u017b"
)
_SEARCH_TRANSLATE_TO = "acelnoszzACELNOSZZ"

_SNAPSHOT_SEARCH_TEXT_SQL = """
coalesce(title, '') || ' ' ||
coalesce(normalized_payload ->> 'id', '') || ' ' ||
coalesce(normalized_payload ->> 'title', '') || ' ' ||
coalesce(normalized_payload ->> 'source_name', '') || ' ' ||
coalesce(normalized_payload ->> 'source_url', '') || ' ' ||
coalesce(normalized_payload ->> 'voivodeship', '') || ' ' ||
coalesce(normalized_payload ->> 'city', '') || ' ' ||
coalesce(normalized_payload ->> 'district', '') || ' ' ||
coalesce(normalized_payload ->> 'municipality', '') || ' ' ||
coalesce(normalized_payload ->> 'area_id', '') || ' ' ||
coalesce(normalized_payload ->> 'address', '') || ' ' ||
coalesce(normalized_payload ->> 'market_type', '') || ' ' ||
coalesce(normalized_payload ->> 'building_type', '') || ' ' ||
coalesce(normalized_payload ->> 'renovation_state', '') || ' ' ||
coalesce(normalized_payload ->> 'developer_id', '') || ' ' ||
coalesce(normalized_payload ->> 'developer_name', '') || ' ' ||
coalesce(normalized_payload ->> 'investment_name', '') || ' ' ||
coalesce(normalized_payload ->> 'primary_market_project_id', '') || ' ' ||
coalesce(normalized_payload ->> 'parking_type', '') || ' ' ||
coalesce(normalized_payload ->> 'heating_type', '') || ' ' ||
coalesce(normalized_payload ->> 'rooms', '') || ' ' ||
coalesce(normalized_payload ->> 'floor', '') || ' ' ||
coalesce(normalized_payload ->> 'building_floors', '') || ' ' ||
coalesce(normalized_payload ->> 'building_year', '')
"""

_PROPERTY_SEARCH_TEXT_SQL = """
coalesce(canonical_address, '') || ' ' ||
coalesce(area_id, '') || ' ' ||
coalesce(voivodeship, '') || ' ' ||
coalesce(city, '') || ' ' ||
coalesce(district, '') || ' ' ||
coalesce(municipality, '') || ' ' ||
coalesce(market_type, '') || ' ' ||
coalesce(building_type, '') || ' ' ||
coalesce(renovation_state, '') || ' ' ||
coalesce(developer_id, '') || ' ' ||
coalesce(developer_name, '') || ' ' ||
coalesce(investment_name, '') || ' ' ||
coalesce(primary_market_project_id, '') || ' ' ||
coalesce(parking_type, '') || ' ' ||
coalesce(heating_type, '') || ' ' ||
coalesce(rooms::text, '') || ' ' ||
coalesce(floor::text, '') || ' ' ||
coalesce(building_floors::text, '') || ' ' ||
coalesce(building_year::text, '')
"""


def upgrade() -> None:
    for table_name in ("properties", "user_submitted_listing_drafts"):
        op.add_column(table_name, sa.Column("developer_id", sa.String(length=120), nullable=True))
        op.add_column(
            table_name,
            sa.Column("developer_name", sa.String(length=160), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("investment_name", sa.String(length=200), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("primary_market_project_id", sa.String(length=160), nullable=True),
        )
        op.create_index(f"ix_{table_name}_developer_id", table_name, ["developer_id"])
        op.create_index(f"ix_{table_name}_developer_name", table_name, ["developer_name"])
        op.create_index(f"ix_{table_name}_investment_name", table_name, ["investment_name"])
        op.create_index(
            f"ix_{table_name}_primary_market_project_id",
            table_name,
            ["primary_market_project_id"],
        )
    _recreate_full_text_indexes()


def downgrade() -> None:
    _recreate_full_text_indexes(include_developer_metadata=False)
    for table_name in ("user_submitted_listing_drafts", "properties"):
        op.drop_index(f"ix_{table_name}_primary_market_project_id", table_name=table_name)
        op.drop_index(f"ix_{table_name}_investment_name", table_name=table_name)
        op.drop_index(f"ix_{table_name}_developer_name", table_name=table_name)
        op.drop_index(f"ix_{table_name}_developer_id", table_name=table_name)
        op.drop_column(table_name, "primary_market_project_id")
        op.drop_column(table_name, "investment_name")
        op.drop_column(table_name, "developer_name")
        op.drop_column(table_name, "developer_id")


def _recreate_full_text_indexes(*, include_developer_metadata: bool = True) -> None:
    op.execute("DROP INDEX IF EXISTS ix_properties_full_text_gin")
    op.execute("DROP INDEX IF EXISTS ix_listing_snapshots_full_text_gin")
    snapshot_sql = (
        _SNAPSHOT_SEARCH_TEXT_SQL
        if include_developer_metadata
        else _SNAPSHOT_SEARCH_TEXT_SQL
        .replace("coalesce(normalized_payload ->> 'developer_id', '') || ' ' ||\n", "")
        .replace("coalesce(normalized_payload ->> 'developer_name', '') || ' ' ||\n", "")
        .replace("coalesce(normalized_payload ->> 'investment_name', '') || ' ' ||\n", "")
        .replace(
            "coalesce(normalized_payload ->> 'primary_market_project_id', '') || ' ' ||\n",
            "",
        )
    )
    property_sql = (
        _PROPERTY_SEARCH_TEXT_SQL
        if include_developer_metadata
        else _PROPERTY_SEARCH_TEXT_SQL
        .replace("coalesce(developer_id, '') || ' ' ||\n", "")
        .replace("coalesce(developer_name, '') || ' ' ||\n", "")
        .replace("coalesce(investment_name, '') || ' ' ||\n", "")
        .replace("coalesce(primary_market_project_id, '') || ' ' ||\n", "")
    )
    op.execute(
        f"""
        CREATE INDEX ix_listing_snapshots_full_text_gin
        ON listing_snapshots
        USING GIN ({_search_vector_sql(snapshot_sql)})
        WHERE normalized_payload ? 'id'
        """
    )
    op.execute(
        f"""
        CREATE INDEX ix_properties_full_text_gin
        ON properties
        USING GIN ({_search_vector_sql(property_sql)})
        """
    )


def _search_vector_sql(text_sql: str) -> str:
    return f"""
    to_tsvector(
        'simple',
        translate(
            lower({text_sql}),
            '{_SEARCH_TRANSLATE_FROM}',
            '{_SEARCH_TRANSLATE_TO}'
        )
    )
    """
