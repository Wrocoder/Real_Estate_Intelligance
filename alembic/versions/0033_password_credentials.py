"""Add password credentials to users.

Revision ID: 0033_password_credentials
Revises: 0032_demo_source_provenance
Create Date: 2026-09-03
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0033_password_credentials"
down_revision: str | None = "0032_demo_source_provenance"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(length=512), nullable=True))
    op.create_index("uq_users_normalized_email", "users", [sa.text("lower(email)")], unique=True)


def downgrade() -> None:
    op.drop_index("uq_users_normalized_email", table_name="users")
    op.drop_column("users", "password_hash")
