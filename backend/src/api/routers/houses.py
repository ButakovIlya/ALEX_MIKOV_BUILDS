from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from api.schemas.houses import (
    HouseGlbOut,
    HouseListItemOut,
    HouseOut,
    HousePhotoOut,
    HouseVideoLinkOut,
    HouseVideoOut,
    house_entity_to_specs_out,
)
from config.containers import Container
from domain.entities.house_model import (
    HouseEntity,
    HouseModelEntity,
    HousePhotoEntity,
    HouseVideoEntity,
    HouseVideoLinkEntity,
)
from domain.exceptions import StorageError
from domain.video_links import video_embed_url
from infrastructure.s3_storage import S3Storage
from infrastructure.uow.alchemy import SqlAlchemyUnitOfWork

router = APIRouter(prefix="/houses", tags=["houses"])

IMAGE_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
}

VIDEO_TYPES = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "mov": "video/quicktime",
    "mkv": "video/x-matroska",
}


def avatar_url(house_id: UUID) -> str:
    return f"/api/v1/houses/{house_id}/avatar/file"


def photo_url(house_id: UUID, photo_id: UUID) -> str:
    return f"/api/v1/houses/{house_id}/photos/{photo_id}/file"


def video_url(house_id: UUID, video_id: UUID) -> str:
    return f"/api/v1/houses/{house_id}/videos/{video_id}/file"


def model_url(house_id: UUID, model_id: UUID) -> str:
    return f"/api/v1/houses/{house_id}/model/file?v={model_id}"


def photo_to_out(photo: HousePhotoEntity) -> HousePhotoOut:
    return HousePhotoOut(
        id=photo.id,
        url=photo_url(photo.house_id, photo.id),
        original_filename=photo.original_filename,
        alt_text=photo.alt_text,
        sort_order=photo.sort_order,
    )


def video_to_out(video: HouseVideoEntity) -> HouseVideoOut:
    return HouseVideoOut(
        id=video.id,
        url=video_url(video.house_id, video.id),
        original_filename=video.original_filename,
        file_size_bytes=video.file_size_bytes,
        title=video.title,
        sort_order=video.sort_order,
    )


def video_link_to_out(link: HouseVideoLinkEntity) -> HouseVideoLinkOut:
    return HouseVideoLinkOut(
        id=link.id,
        platform=link.platform,
        url=link.url,
        title=link.title,
        embed_url=video_embed_url(link.platform, link.url),
        sort_order=link.sort_order,
    )


def glb_to_out(house_id: UUID, model: HouseModelEntity) -> HouseGlbOut:
    return HouseGlbOut(
        id=model.id,
        url=model_url(house_id, model.id),
        original_filename=model.original_filename,
        file_size_bytes=model.file_size_bytes,
    )


def model_list_url(house_id: UUID, glb: HouseModelEntity | None) -> str | None:
    if glb is None:
        return None
    return model_url(house_id, glb.id)


async def build_house_out(uw: SqlAlchemyUnitOfWork, house: HouseEntity) -> HouseOut:
    photos = await uw.house_photos.list_by_house(house.id)
    videos = await uw.house_videos.list_by_house(house.id)
    video_links = await uw.house_video_links.list_by_house(house.id)
    glb = await uw.house_models.get_by_house_id(house.id)
    return HouseOut(
        id=house.id,
        name=house.name,
        description=house.description,
        location=house.location,
        area_sqm=house.area_sqm,
        is_published=house.is_published,
        sort_order=house.sort_order,
        avatar_url=avatar_url(house.id) if house.avatar_s3_key else None,
        photos=[photo_to_out(p) for p in photos],
        videos=[video_to_out(v) for v in videos],
        video_links=[video_link_to_out(l) for l in video_links],
        model=glb_to_out(house.id, glb) if glb else None,
        created_at=house.created_at,
        **house_entity_to_specs_out(house),
    )


def cover_url_for_house(house: HouseEntity, photos: list[HousePhotoEntity]) -> str | None:
    if house.avatar_s3_key:
        return avatar_url(house.id)
    if photos:
        return photo_to_out(photos[0]).url
    return None


@router.get("", response_model=list[HouseListItemOut])
@inject
async def list_houses(
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
) -> list[HouseListItemOut]:
    async with uow() as uw:
        houses = await uw.houses.list_published()
        items: list[HouseListItemOut] = []
        for house in houses:
            photos = await uw.house_photos.list_by_house(house.id)
            videos = await uw.house_videos.list_by_house(house.id)
            video_links = await uw.house_video_links.list_by_house(house.id)
            glb = await uw.house_models.get_by_house_id(house.id)
            items.append(
                HouseListItemOut(
                    id=house.id,
                    name=house.name,
                    description=house.description,
                    location=house.location,
                    area_sqm=house.area_sqm,
                    cover_url=cover_url_for_house(house, photos),
                    has_model=glb is not None,
                    model_url=model_list_url(house.id, glb),
                    has_videos=bool(videos or video_links),
                    price_rub=house.price_rub,
                    object_type=house.object_type,
                    latitude=house.latitude,
                    longitude=house.longitude,
                    created_at=house.created_at,
                )
            )
    return items


@router.get("/{house_id}", response_model=HouseOut)
@inject
async def get_house(
    house_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
) -> HouseOut:
    async with uow() as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None or not house.is_published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house)


@router.get("/{house_id}/avatar/file")
@inject
async def download_avatar(
    house_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> StreamingResponse:
    async with uow() as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None or not house.avatar_s3_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
        key = house.avatar_s3_key
    try:
        stream, content_type = s3.get_object_stream(key)
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return StreamingResponse(stream, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/{house_id}/photos/{photo_id}/file")
@inject
async def download_photo(
    house_id: UUID,
    photo_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> StreamingResponse:
    async with uow() as uw:
        photo = await uw.house_photos.get_by_id(photo_id)
        if photo is None or photo.house_id != house_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    try:
        stream, content_type = s3.get_object_stream(photo.s3_key)
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    ext = photo.original_filename.rsplit(".", 1)[-1].lower()
    media_type = IMAGE_TYPES.get(ext, content_type)
    return StreamingResponse(stream, media_type=media_type, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/{house_id}/videos/{video_id}/file")
@inject
async def download_video(
    house_id: UUID,
    video_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> StreamingResponse:
    async with uow() as uw:
        video = await uw.house_videos.get_by_id(video_id)
        if video is None or video.house_id != house_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    try:
        stream, content_type = s3.get_object_stream(video.s3_key)
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    ext = video.original_filename.rsplit(".", 1)[-1].lower()
    media_type = VIDEO_TYPES.get(ext, content_type)
    return StreamingResponse(stream, media_type=media_type, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/{house_id}/model/file")
@inject
async def download_model(
    house_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> StreamingResponse:
    async with uow() as uw:
        model = await uw.house_models.get_by_house_id(house_id)
        if model is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
    try:
        stream, content_type = s3.get_object_stream(model.s3_key)
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return StreamingResponse(
        stream,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
