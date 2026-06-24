"""houses schema

Revision ID: 002
Revises: 001
Create Date: 2026-06-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "houses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("area_sqm", sa.Integer(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "house_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("house_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("s3_key", sa.String(length=512), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["house_id"], ["houses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("s3_key"),
    )

    op.add_column("house_models", sa.Column("house_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_house_models_house_id",
        "house_models",
        "houses",
        ["house_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint("uq_house_models_house_id", "house_models", ["house_id"])


def downgrade() -> None:
    op.drop_constraint("uq_house_models_house_id", "house_models", type_="unique")
    op.drop_constraint("fk_house_models_house_id", "house_models", type_="foreignkey")
    op.drop_column("house_models", "house_id")
    op.drop_table("house_photos")
    op.drop_table("houses")
