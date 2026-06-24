import io
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from api.routers.auth import get_current_admin
from api.routers.houses import build_house_out
from api.schemas.houses import HouseCreateIn, HouseOut, HouseUpdateIn, HouseVideoLinkCreateIn, house_in_to_write_data
from config.containers import Container
from domain.exceptions import StorageError
from domain.video_links import VideoLinkError, detect_video_platform, normalize_video_url
from infrastructure.s3_storage import S3Storage
from infrastructure.uow.alchemy import SqlAlchemyUnitOfWork

router = APIRouter(prefix="/admin/houses", tags=["admin"])

ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO = {".mp4", ".webm", ".mov", ".mkv"}


def _delete_s3_keys(s3: S3Storage, keys: list[str | None]) -> None:
    for key in keys:
        if not key:
            continue
        try:
            s3.delete_object(key)
        except StorageError:
            pass


@router.get("", response_model=list[HouseOut])
@inject
async def admin_list_houses(
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> list[HouseOut]:
    async with uow() as uw:
        houses = await uw.houses.list_all()
        return [await build_house_out(uw, h, s3) for h in houses]


@router.post("", response_model=HouseOut, status_code=status.HTTP_201_CREATED)
@inject
async def create_house(
    body: HouseCreateIn,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        house = await uw.houses.create(house_in_to_write_data(body))
        return await build_house_out(uw, house, s3)


@router.put("/{house_id}", response_model=HouseOut)
@inject
async def update_house(
    house_id: UUID,
    body: HouseUpdateIn,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        house = await uw.houses.update(house_id, house_in_to_write_data(body))
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def delete_house(
    house_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> None:
    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        photo_keys = await uw.house_photos.list_s3_keys_by_house(house_id)
        video_keys = await uw.house_videos.list_s3_keys_by_house(house_id)
        glb_key = await uw.house_models.get_s3_key_by_house(house_id)
        avatar_key = house.avatar_s3_key
        await uw.houses.delete(house_id)
    _delete_s3_keys(s3, [*photo_keys, *video_keys, glb_key, avatar_key])


@router.post("/{house_id}/avatar", response_model=HouseOut)
@inject
async def upload_avatar(
    house_id: UUID,
    file: UploadFile = File(...),
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files allowed")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        if house.avatar_s3_key:
            _delete_s3_keys(s3, [house.avatar_s3_key])
        key = S3Storage.build_avatar_key(house_id, file.filename)
        try:
            s3.upload_fileobj(io.BytesIO(content), key, S3Storage.image_content_type(ext))
        except StorageError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        house = await uw.houses.set_avatar_s3_key(house_id, key)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}/avatar", response_model=HouseOut)
@inject
async def delete_avatar(
    house_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        if house.avatar_s3_key:
            _delete_s3_keys(s3, [house.avatar_s3_key])
        house = await uw.houses.set_avatar_s3_key(house_id, None)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.post("/{house_id}/photos", response_model=HouseOut)
@inject
async def upload_photo(
    house_id: UUID,
    file: UploadFile = File(...),
    alt_text: str = Form(""),
    sort_order: int = Form(0),
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMAGE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files allowed")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        key = S3Storage.build_photo_key(house_id, file.filename)
        try:
            s3.upload_fileobj(io.BytesIO(content), key, S3Storage.image_content_type(ext))
        except StorageError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        await uw.house_photos.create(
            house_id=house_id,
            s3_key=key,
            original_filename=file.filename,
            file_size_bytes=len(content),
            alt_text=alt_text or house.name,
            sort_order=sort_order,
        )
        house = await uw.houses.get_by_id(house_id)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}/photos/{photo_id}", response_model=HouseOut)
@inject
async def delete_photo(
    house_id: UUID,
    photo_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        photo = await uw.house_photos.get_by_id(photo_id)
        if photo is None or photo.house_id != house_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
        _delete_s3_keys(s3, [photo.s3_key])
        await uw.house_photos.delete(photo_id)
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house, s3)


@router.post("/{house_id}/videos", response_model=HouseOut)
@inject
async def upload_video(
    house_id: UUID,
    file: UploadFile = File(...),
    title: str = Form(""),
    sort_order: int = Form(0),
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename required")
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_VIDEO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only video files allowed")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        key = S3Storage.build_video_key(house_id, file.filename)
        try:
            s3.upload_fileobj(io.BytesIO(content), key, S3Storage.video_content_type(ext))
        except StorageError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        await uw.house_videos.create(
            house_id=house_id,
            s3_key=key,
            original_filename=file.filename,
            file_size_bytes=len(content),
            title=title or file.filename,
            sort_order=sort_order,
        )
        house = await uw.houses.get_by_id(house_id)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}/videos/{video_id}", response_model=HouseOut)
@inject
async def delete_video(
    house_id: UUID,
    video_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        video = await uw.house_videos.get_by_id(video_id)
        if video is None or video.house_id != house_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        _delete_s3_keys(s3, [video.s3_key])
        await uw.house_videos.delete(video_id)
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house, s3)


@router.post("/{house_id}/video-links", response_model=HouseOut)
@inject
async def add_video_link(
    house_id: UUID,
    body: HouseVideoLinkCreateIn,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    url = normalize_video_url(str(body.url))
    try:
        platform = detect_video_platform(url)
    except VideoLinkError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        await uw.house_video_links.create(
            house_id=house_id,
            platform=platform,
            url=url,
            title=body.title or house.name,
            sort_order=0,
        )
        house = await uw.houses.get_by_id(house_id)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}/video-links/{link_id}", response_model=HouseOut)
@inject
async def delete_video_link(
    house_id: UUID,
    link_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        link = await uw.house_video_links.get_by_id(link_id)
        if link is None or link.house_id != house_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
        await uw.house_video_links.delete(link_id)
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house, s3)


@router.post("/{house_id}/model", response_model=HouseOut)
@inject
async def upload_model(
    house_id: UUID,
    file: UploadFile = File(...),
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    if not file.filename or not file.filename.lower().endswith(".glb"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .glb files allowed")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    async with uow(autocommit=True) as uw:
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        existing = await uw.house_models.get_by_house_id(house_id)
        if existing:
            _delete_s3_keys(s3, [existing.s3_key])
            await uw.house_models.delete(existing.id)
        key = S3Storage.build_glb_key(file.filename)
        try:
            s3.upload_fileobj(io.BytesIO(content), key, "model/gltf-binary")
        except StorageError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
        await uw.house_models.create(
            house_id=house_id,
            name=house.name,
            description=house.description,
            s3_key=key,
            original_filename=file.filename,
            file_size_bytes=len(content),
        )
        house = await uw.houses.get_by_id(house_id)
        assert house is not None
        return await build_house_out(uw, house, s3)


@router.delete("/{house_id}/model", response_model=HouseOut)
@inject
async def delete_model(
    house_id: UUID,
    _: str = Depends(get_current_admin),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseOut:
    async with uow(autocommit=True) as uw:
        model = await uw.house_models.get_by_house_id(house_id)
        if model is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
        _delete_s3_keys(s3, [model.s3_key])
        await uw.house_models.delete(model.id)
        house = await uw.houses.get_by_id(house_id)
        if house is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="House not found")
        return await build_house_out(uw, house, s3)
