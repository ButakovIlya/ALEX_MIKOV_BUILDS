from dataclasses import dataclass
from decimal import Decimal


@dataclass
class HouseWriteData:
    name: str
    description: str
    location: str
    area_sqm: int | None
    is_published: bool
    sort_order: int
    address: str
    latitude: Decimal | None
    longitude: Decimal | None
    object_type: str | None
    readiness: str | None
    land_category: str | None
    build_year: int | None
    wall_material: str | None
    roof_material: str | None
    floors_count: int | None
    rooms_count: int | None
    plot_area_sotka: Decimal | None
    price_rub: int | None
    cadastral_number: str | None
    distance_to_city_km: Decimal | None
    ceiling_height_m: Decimal | None
    renovation: str | None
    parking: str | None
    electricity: str | None
    gas: str | None
    heating: str | None
    water_supply: str | None
    sewage: str | None
    has_bathhouse: bool
    has_pool: bool
    has_terrace: bool
    bathroom_in_house: bool
    bathroom_outside: bool
    has_wifi: bool
    has_tv: bool
    transport_asphalt: bool
    transport_public_stop: bool
    transport_railway: bool
    infra_shop: bool
    infra_pharmacy: bool
    infra_kindergarten: bool
    infra_school: bool
    is_mortgage_available: bool
    is_share_sale: bool
    is_auction: bool
    has_fence: bool
    has_security: bool
