"""address catalog for OSM autocomplete

Revision ID: 005
Revises: 004
Create Date: 2026-06-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_table(
        "address_catalog",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("search_text", sa.Text(), nullable=False),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("region", sa.Text(), nullable=True),
        sa.Column("street", sa.Text(), nullable=True),
        sa.Column("house_number", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("osm_type", sa.String(length=16), nullable=False),
        sa.Column("osm_id", sa.BigInteger(), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False, server_default="osm"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("osm_type", "osm_id", name="uq_address_catalog_osm"),
    )
    op.create_index("ix_address_catalog_search_text_trgm", "address_catalog", ["search_text"], postgresql_using="gin", postgresql_ops={"search_text": "gin_trgm_ops"})


def downgrade() -> None:
    op.drop_index("ix_address_catalog_search_text_trgm", table_name="address_catalog")
    op.drop_table("address_catalog")
