"""Add full-text indexes for listing search.

Revision ID: 0025_listing_full_text_indexes
Revises: 0024_listing_lifestyle_attributes
Create Date: 2026-07-16
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0025_listing_full_text_indexes"
down_revision: str | None = "0024_listing_lifestyle_attributes"
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
coalesce(parking_type, '') || ' ' ||
coalesce(heating_type, '') || ' ' ||
coalesce(rooms::text, '') || ' ' ||
coalesce(floor::text, '') || ' ' ||
coalesce(building_floors::text, '') || ' ' ||
coalesce(building_year::text, '')
"""


def upgrade() -> None:
    op.execute(
        """
        CREATE INDEX ix_listing_snapshots_listing_id
        ON listing_snapshots ((normalized_payload ->> 'id'))
        WHERE normalized_payload ? 'id'
        """
    )
    op.execute(
        f"""
        CREATE INDEX ix_listing_snapshots_full_text_gin
        ON listing_snapshots
        USING GIN ({_search_vector_sql(_SNAPSHOT_SEARCH_TEXT_SQL)})
        WHERE normalized_payload ? 'id'
        """
    )
    op.execute(
        f"""
        CREATE INDEX ix_properties_full_text_gin
        ON properties
        USING GIN ({_search_vector_sql(_PROPERTY_SEARCH_TEXT_SQL)})
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_properties_full_text_gin")
    op.execute("DROP INDEX IF EXISTS ix_listing_snapshots_full_text_gin")
    op.execute("DROP INDEX IF EXISTS ix_listing_snapshots_listing_id")


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
