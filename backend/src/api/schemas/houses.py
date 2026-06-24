from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, field_validator

from domain.entities.house_write import HouseWriteData
from domain.enums.house import (
    GasType,
    LandCategory,
    ObjectType,
    ParkingType,
    Readiness,
    Renovation,
    RoofMaterial,
    SewageType,
    UtilityLevel,
    WallMaterial,
    WaterSupplyType,
)


class HousePhotoOut(BaseModel):
    id: UUID
    url: str
    original_filename: str
    alt_text: str
    sort_order: int


class HouseVideoOut(BaseModel):
    id: UUID
    url: str
    original_filename: str
    file_size_bytes: int
    title: str
    sort_order: int


class HouseVideoLinkOut(BaseModel):
    id: UUID
    platform: str
    url: str
    title: str
    embed_url: str | None
    sort_order: int


class HouseGlbOut(BaseModel):
    id: UUID
    url: str
    original_filename: str
    file_size_bytes: int


class HouseSpecsIn(BaseModel):
    address: str = ""
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    object_type: ObjectType | None = None
    readiness: Readiness | None = None
    land_category: LandCategory | None = None
    build_year: int | None = Field(default=None, ge=1800, le=2100)
    wall_material: WallMaterial | None = None
    roof_material: RoofMaterial | None = None
    floors_count: int | None = Field(default=None, ge=1, le=50)
    rooms_count: int | None = Field(default=None, ge=0, le=100)
    plot_area_sotka: Decimal | None = Field(default=None, ge=0)
    price_rub: int | None = Field(default=None, ge=0)
    cadastral_number: str | None = None
    distance_to_city_km: Decimal | None = Field(default=None, ge=0)
    ceiling_height_m: Decimal | None = Field(default=None, ge=0)
    renovation: Renovation | None = None
    parking: ParkingType | None = None
    electricity: UtilityLevel | None = None
    gas: GasType | None = None
    heating: UtilityLevel | None = None
    water_supply: WaterSupplyType | None = None
    sewage: SewageType | None = None
    has_bathhouse: bool = False
    has_pool: bool = False
    has_terrace: bool = False
    bathroom_in_house: bool = False
    bathroom_outside: bool = False
    has_wifi: bool = False
    has_tv: bool = False
    transport_asphalt: bool = False
    transport_public_stop: bool = False
    transport_railway: bool = False
    infra_shop: bool = False
    infra_pharmacy: bool = False
    infra_kindergarten: bool = False
    infra_school: bool = False
    is_mortgage_available: bool = False
    is_share_sale: bool = False
    is_auction: bool = False
    has_fence: bool = False
    has_security: bool = False

    @field_validator(
        "object_type",
        "readiness",
        "land_category",
        "wall_material",
        "roof_material",
        "renovation",
        "parking",
        "electricity",
        "gas",
        "heating",
        "water_supply",
        "sewage",
        mode="before",
    )
    @classmethod
    def empty_str_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class HouseSpecsOut(HouseSpecsIn):
    pass


class HouseOut(HouseSpecsOut):
    id: UUID
    name: str
    description: str
    location: str
    area_sqm: int | None
    is_published: bool
    sort_order: int
    avatar_url: str | None
    photos: list[HousePhotoOut]
    videos: list[HouseVideoOut]
    video_links: list[HouseVideoLinkOut]
    model: HouseGlbOut | None
    created_at: datetime


class HouseListItemOut(BaseModel):
    id: UUID
    name: str
    description: str
    location: str
    area_sqm: int | None
    cover_url: str | None
    has_model: bool
    model_url: str | None
    has_videos: bool
    price_rub: int | None
    object_type: ObjectType | None
    latitude: Decimal | None
    longitude: Decimal | None
    created_at: datetime


class HouseCreateIn(HouseSpecsIn):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    location: str = ""
    area_sqm: int | None = None
    is_published: bool = True
    sort_order: int = 0


class HouseUpdateIn(HouseCreateIn):
    pass


class HouseVideoLinkCreateIn(BaseModel):
    url: HttpUrl
    title: str = ""


def _enum_str(value: object | None) -> str | None:
    if value is None:
        return None
    return str(value)


def house_in_to_write_data(body: HouseCreateIn) -> HouseWriteData:
    return HouseWriteData(
        name=body.name,
        description=body.description,
        location=body.location,
        area_sqm=body.area_sqm,
        is_published=body.is_published,
        sort_order=body.sort_order,
        address=body.address,
        latitude=body.latitude,
        longitude=body.longitude,
        object_type=_enum_str(body.object_type),
        readiness=_enum_str(body.readiness),
        land_category=_enum_str(body.land_category),
        build_year=body.build_year,
        wall_material=_enum_str(body.wall_material),
        roof_material=_enum_str(body.roof_material),
        floors_count=body.floors_count,
        rooms_count=body.rooms_count,
        plot_area_sotka=body.plot_area_sotka,
        price_rub=body.price_rub,
        cadastral_number=body.cadastral_number,
        distance_to_city_km=body.distance_to_city_km,
        ceiling_height_m=body.ceiling_height_m,
        renovation=_enum_str(body.renovation),
        parking=_enum_str(body.parking),
        electricity=_enum_str(body.electricity),
        gas=_enum_str(body.gas),
        heating=_enum_str(body.heating),
        water_supply=_enum_str(body.water_supply),
        sewage=_enum_str(body.sewage),
        has_bathhouse=body.has_bathhouse,
        has_pool=body.has_pool,
        has_terrace=body.has_terrace,
        bathroom_in_house=body.bathroom_in_house,
        bathroom_outside=body.bathroom_outside,
        has_wifi=body.has_wifi,
        has_tv=body.has_tv,
        transport_asphalt=body.transport_asphalt,
        transport_public_stop=body.transport_public_stop,
        transport_railway=body.transport_railway,
        infra_shop=body.infra_shop,
        infra_pharmacy=body.infra_pharmacy,
        infra_kindergarten=body.infra_kindergarten,
        infra_school=body.infra_school,
        is_mortgage_available=body.is_mortgage_available,
        is_share_sale=body.is_share_sale,
        is_auction=body.is_auction,
        has_fence=body.has_fence,
        has_security=body.has_security,
    )


def house_entity_to_specs_out(house: object) -> dict:
    """Map HouseEntity fields to HouseSpecsOut-compatible dict."""
    from domain.entities.house_model import HouseEntity

    assert isinstance(house, HouseEntity)
    return {
        "address": house.address,
        "latitude": house.latitude,
        "longitude": house.longitude,
        "object_type": house.object_type,
        "readiness": house.readiness,
        "land_category": house.land_category,
        "build_year": house.build_year,
        "wall_material": house.wall_material,
        "roof_material": house.roof_material,
        "floors_count": house.floors_count,
        "rooms_count": house.rooms_count,
        "plot_area_sotka": house.plot_area_sotka,
        "price_rub": house.price_rub,
        "cadastral_number": house.cadastral_number,
        "distance_to_city_km": house.distance_to_city_km,
        "ceiling_height_m": house.ceiling_height_m,
        "renovation": house.renovation,
        "parking": house.parking,
        "electricity": house.electricity,
        "gas": house.gas,
        "heating": house.heating,
        "water_supply": house.water_supply,
        "sewage": house.sewage,
        "has_bathhouse": house.has_bathhouse,
        "has_pool": house.has_pool,
        "has_terrace": house.has_terrace,
        "bathroom_in_house": house.bathroom_in_house,
        "bathroom_outside": house.bathroom_outside,
        "has_wifi": house.has_wifi,
        "has_tv": house.has_tv,
        "transport_asphalt": house.transport_asphalt,
        "transport_public_stop": house.transport_public_stop,
        "transport_railway": house.transport_railway,
        "infra_shop": house.infra_shop,
        "infra_pharmacy": house.infra_pharmacy,
        "infra_kindergarten": house.infra_kindergarten,
        "infra_school": house.infra_school,
        "is_mortgage_available": house.is_mortgage_available,
        "is_share_sale": house.is_share_sale,
        "is_auction": house.is_auction,
        "has_fence": house.has_fence,
        "has_security": house.has_security,
    }
