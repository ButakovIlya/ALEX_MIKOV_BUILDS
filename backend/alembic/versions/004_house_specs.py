"""house specs columns

Revision ID: 004
Revises: 003
Create Date: 2026-06-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("houses", sa.Column("address", sa.Text(), nullable=False, server_default=""))
    op.add_column("houses", sa.Column("latitude", sa.Numeric(9, 6), nullable=True))
    op.add_column("houses", sa.Column("longitude", sa.Numeric(9, 6), nullable=True))
    op.add_column("houses", sa.Column("object_type", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("readiness", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("land_category", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("build_year", sa.Integer(), nullable=True))
    op.add_column("houses", sa.Column("wall_material", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("roof_material", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("floors_count", sa.Integer(), nullable=True))
    op.add_column("houses", sa.Column("rooms_count", sa.Integer(), nullable=True))
    op.add_column("houses", sa.Column("plot_area_sotka", sa.Numeric(8, 2), nullable=True))
    op.add_column("houses", sa.Column("price_rub", sa.BigInteger(), nullable=True))
    op.add_column("houses", sa.Column("cadastral_number", sa.String(length=64), nullable=True))
    op.add_column("houses", sa.Column("distance_to_city_km", sa.Numeric(6, 1), nullable=True))
    op.add_column("houses", sa.Column("ceiling_height_m", sa.Numeric(4, 2), nullable=True))
    op.add_column("houses", sa.Column("renovation", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("parking", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("electricity", sa.String(length=16), nullable=True))
    op.add_column("houses", sa.Column("gas", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("heating", sa.String(length=16), nullable=True))
    op.add_column("houses", sa.Column("water_supply", sa.String(length=32), nullable=True))
    op.add_column("houses", sa.Column("sewage", sa.String(length=32), nullable=True))

    for col in (
        "has_bathhouse",
        "has_pool",
        "has_terrace",
        "bathroom_in_house",
        "bathroom_outside",
        "has_wifi",
        "has_tv",
        "transport_asphalt",
        "transport_public_stop",
        "transport_railway",
        "infra_shop",
        "infra_pharmacy",
        "infra_kindergarten",
        "infra_school",
        "is_mortgage_available",
        "is_share_sale",
        "is_auction",
        "has_fence",
        "has_security",
    ):
        op.add_column("houses", sa.Column(col, sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    cols = [
        "address",
        "latitude",
        "longitude",
        "object_type",
        "readiness",
        "land_category",
        "build_year",
        "wall_material",
        "roof_material",
        "floors_count",
        "rooms_count",
        "plot_area_sotka",
        "price_rub",
        "cadastral_number",
        "distance_to_city_km",
        "ceiling_height_m",
        "renovation",
        "parking",
        "electricity",
        "gas",
        "heating",
        "water_supply",
        "sewage",
        "has_bathhouse",
        "has_pool",
        "has_terrace",
        "bathroom_in_house",
        "bathroom_outside",
        "has_wifi",
        "has_tv",
        "transport_asphalt",
        "transport_public_stop",
        "transport_railway",
        "infra_shop",
        "infra_pharmacy",
        "infra_kindergarten",
        "infra_school",
        "is_mortgage_available",
        "is_share_sale",
        "is_auction",
        "has_fence",
        "has_security",
    ]
    for col in cols:
        op.drop_column("houses", col)
