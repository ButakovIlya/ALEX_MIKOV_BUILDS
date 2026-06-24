from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID


@dataclass
class AdminUserEntity:
    id: UUID
    username: str
    password_hash: str
    is_active: bool


@dataclass
class HouseEntity:
    id: UUID
    name: str
    description: str
    location: str
    area_sqm: int | None
    is_published: bool
    sort_order: int
    avatar_s3_key: str | None
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
    created_at: datetime
    updated_at: datetime


@dataclass
class HousePhotoEntity:
    id: UUID
    house_id: UUID
    s3_key: str
    original_filename: str
    file_size_bytes: int
    alt_text: str
    sort_order: int
    created_at: datetime


@dataclass
class HouseVideoEntity:
    id: UUID
    house_id: UUID
    s3_key: str
    original_filename: str
    file_size_bytes: int
    title: str
    sort_order: int
    created_at: datetime


@dataclass
class HouseVideoLinkEntity:
    id: UUID
    house_id: UUID
    platform: str
    url: str
    title: str
    sort_order: int
    created_at: datetime


@dataclass
class HouseModelEntity:
    id: UUID
    house_id: UUID | None
    name: str
    description: str
    s3_key: str
    original_filename: str
    file_size_bytes: int
    created_at: datetime
    updated_at: datetime
