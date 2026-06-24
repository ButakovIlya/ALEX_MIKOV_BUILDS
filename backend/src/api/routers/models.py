from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, StreamingResponse

from api.schemas.models import HouseModelOut
from config.containers import Container
from domain.entities.house_model import HouseModelEntity
from domain.exceptions import StorageError
from infrastructure.s3_storage import S3Storage
from infrastructure.uow.alchemy import SqlAlchemyUnitOfWork

router = APIRouter(prefix="/models", tags=["models"])


def entity_to_out(entity: HouseModelEntity, s3: S3Storage | None = None) -> HouseModelOut:
    direct = s3.get_public_download_url(entity.s3_key) if s3 else None
    return HouseModelOut(
        id=entity.id,
        name=entity.name,
        description=entity.description,
        glb=direct or f"/api/v1/models/{entity.id}/file",
        original_filename=entity.original_filename,
        file_size_bytes=entity.file_size_bytes,
        created_at=entity.created_at,
    )


@router.get("", response_model=list[HouseModelOut])
@inject
async def list_models(
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> list[HouseModelOut]:
    async with uow() as uw:
        models = await uw.house_models.list_all()
    return [entity_to_out(m, s3) for m in models]


@router.get("/{model_id}", response_model=HouseModelOut)
@inject
async def get_model(
    model_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> HouseModelOut:
    async with uow() as uw:
        model = await uw.house_models.get_by_id(model_id)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
    return entity_to_out(model, s3)


@router.get("/{model_id}/file")
@inject
async def download_model_file(
    model_id: UUID,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    s3: S3Storage = Depends(Provide[Container.s3]),
) -> StreamingResponse:
    async with uow() as uw:
        model = await uw.house_models.get_by_id(model_id)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
    try:
        direct_url = s3.get_public_download_url(model.s3_key)
        if direct_url:
            return RedirectResponse(direct_url, status_code=307)
        stream, content_type, content_length = s3.get_object_stream(model.s3_key)
    except StorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return StreamingResponse(
        stream,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            **({"Content-Length": str(content_length)} if content_length is not None else {}),
        },
    )
