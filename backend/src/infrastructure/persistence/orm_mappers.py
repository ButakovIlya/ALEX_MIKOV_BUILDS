from domain.entities.house_model import (
    AdminUserEntity,
    HouseEntity,
    HouseModelEntity,
    HousePhotoEntity,
    HouseVideoEntity,
    HouseVideoLinkEntity,
)
from infrastructure.db.models import (
    AdminUserModel,
    HouseModelModel,
    HousePhotoRecord,
    HouseRecord,
    HouseVideoLinkRecord,
    HouseVideoRecord,
)


def to_admin_user_entity(model: AdminUserModel) -> AdminUserEntity:
    return AdminUserEntity(
        id=model.id,
        username=model.username,
        password_hash=model.password_hash,
        is_active=model.is_active,
    )


def to_house_entity(model: HouseRecord) -> HouseEntity:
    return HouseEntity(
        id=model.id,
        name=model.name,
        description=model.description,
        location=model.location,
        area_sqm=model.area_sqm,
        is_published=model.is_published,
        sort_order=model.sort_order,
        avatar_s3_key=model.avatar_s3_key,
        address=model.address,
        latitude=model.latitude,
        longitude=model.longitude,
        object_type=model.object_type,
        readiness=model.readiness,
        land_category=model.land_category,
        build_year=model.build_year,
        wall_material=model.wall_material,
        roof_material=model.roof_material,
        floors_count=model.floors_count,
        rooms_count=model.rooms_count,
        plot_area_sotka=model.plot_area_sotka,
        price_rub=model.price_rub,
        cadastral_number=model.cadastral_number,
        distance_to_city_km=model.distance_to_city_km,
        ceiling_height_m=model.ceiling_height_m,
        renovation=model.renovation,
        parking=model.parking,
        electricity=model.electricity,
        gas=model.gas,
        heating=model.heating,
        water_supply=model.water_supply,
        sewage=model.sewage,
        has_bathhouse=model.has_bathhouse,
        has_pool=model.has_pool,
        has_terrace=model.has_terrace,
        bathroom_in_house=model.bathroom_in_house,
        bathroom_outside=model.bathroom_outside,
        has_wifi=model.has_wifi,
        has_tv=model.has_tv,
        transport_asphalt=model.transport_asphalt,
        transport_public_stop=model.transport_public_stop,
        transport_railway=model.transport_railway,
        infra_shop=model.infra_shop,
        infra_pharmacy=model.infra_pharmacy,
        infra_kindergarten=model.infra_kindergarten,
        infra_school=model.infra_school,
        is_mortgage_available=model.is_mortgage_available,
        is_share_sale=model.is_share_sale,
        is_auction=model.is_auction,
        has_fence=model.has_fence,
        has_security=model.has_security,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def to_house_photo_entity(model: HousePhotoRecord) -> HousePhotoEntity:
    return HousePhotoEntity(
        id=model.id,
        house_id=model.house_id,
        s3_key=model.s3_key,
        original_filename=model.original_filename,
        file_size_bytes=model.file_size_bytes,
        alt_text=model.alt_text,
        sort_order=model.sort_order,
        created_at=model.created_at,
    )


def to_house_video_entity(model: HouseVideoRecord) -> HouseVideoEntity:
    return HouseVideoEntity(
        id=model.id,
        house_id=model.house_id,
        s3_key=model.s3_key,
        original_filename=model.original_filename,
        file_size_bytes=model.file_size_bytes,
        title=model.title,
        sort_order=model.sort_order,
        created_at=model.created_at,
    )


def to_house_video_link_entity(model: HouseVideoLinkRecord) -> HouseVideoLinkEntity:
    return HouseVideoLinkEntity(
        id=model.id,
        house_id=model.house_id,
        platform=model.platform,
        url=model.url,
        title=model.title,
        sort_order=model.sort_order,
        created_at=model.created_at,
    )


def to_house_model_entity(model: HouseModelModel) -> HouseModelEntity:
    return HouseModelEntity(
        id=model.id,
        house_id=model.house_id,
        name=model.name,
        description=model.description,
        s3_key=model.s3_key,
        original_filename=model.original_filename,
        file_size_bytes=model.file_size_bytes,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
