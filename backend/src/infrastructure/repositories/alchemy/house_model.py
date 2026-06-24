from uuid import UUID

from sqlalchemy import delete, select, update

from domain.entities.house_model import (
    AdminUserEntity,
    HouseEntity,
    HouseModelEntity,
    HousePhotoEntity,
    HouseVideoEntity,
    HouseVideoLinkEntity,
)
from domain.entities.house_write import HouseWriteData
from domain.repositories.house_model import (
    AdminUserRepository,
    HouseModelRepository,
    HousePhotoRepository,
    HouseRepository,
    HouseVideoLinkRepository,
    HouseVideoRepository,
)
from infrastructure.db.models import (
    AdminUserModel,
    HouseModelModel,
    HousePhotoRecord,
    HouseRecord,
    HouseVideoLinkRecord,
    HouseVideoRecord,
)
from infrastructure.persistence.house_write import house_write_values
from infrastructure.persistence.orm_mappers import (
    to_admin_user_entity,
    to_house_entity,
    to_house_model_entity,
    to_house_photo_entity,
    to_house_video_entity,
    to_house_video_link_entity,
)
from infrastructure.repositories.alchemy.base import SqlAlchemyAsyncRepository


class SqlAlchemyAdminUserRepository(SqlAlchemyAsyncRepository, AdminUserRepository):
    async def get_by_username(self, username: str) -> AdminUserEntity | None:
        result = await self._session.execute(
            select(AdminUserModel).where(AdminUserModel.username == username)
        )
        model = result.scalar_one_or_none()
        return to_admin_user_entity(model) if model else None

    async def create(self, username: str, password_hash: str) -> AdminUserEntity:
        model = AdminUserModel(username=username, password_hash=password_hash)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_admin_user_entity(model)


class SqlAlchemyHouseRepository(SqlAlchemyAsyncRepository, HouseRepository):
    async def list_published(self) -> list[HouseEntity]:
        result = await self._session.execute(
            select(HouseRecord)
            .where(HouseRecord.is_published.is_(True))
            .order_by(HouseRecord.sort_order, HouseRecord.created_at.desc())
        )
        return [to_house_entity(m) for m in result.scalars().all()]

    async def list_all(self) -> list[HouseEntity]:
        result = await self._session.execute(
            select(HouseRecord).order_by(HouseRecord.sort_order, HouseRecord.created_at.desc())
        )
        return [to_house_entity(m) for m in result.scalars().all()]

    async def get_by_id(self, house_id: UUID) -> HouseEntity | None:
        model = await self._session.get(HouseRecord, house_id)
        return to_house_entity(model) if model else None

    async def create(self, data: HouseWriteData) -> HouseEntity:
        model = HouseRecord(**house_write_values(data))
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_house_entity(model)

    async def update(self, house_id: UUID, data: HouseWriteData) -> HouseEntity | None:
        await self._session.execute(
            update(HouseRecord).where(HouseRecord.id == house_id).values(**house_write_values(data))
        )
        model = await self._session.get(HouseRecord, house_id)
        return to_house_entity(model) if model else None

    async def set_avatar_s3_key(self, house_id: UUID, avatar_s3_key: str | None) -> HouseEntity | None:
        await self._session.execute(
            update(HouseRecord).where(HouseRecord.id == house_id).values(avatar_s3_key=avatar_s3_key)
        )
        model = await self._session.get(HouseRecord, house_id)
        return to_house_entity(model) if model else None

    async def delete(self, house_id: UUID) -> None:
        await self._session.execute(delete(HouseRecord).where(HouseRecord.id == house_id))


class SqlAlchemyHousePhotoRepository(SqlAlchemyAsyncRepository, HousePhotoRepository):
    async def list_by_house(self, house_id: UUID) -> list[HousePhotoEntity]:
        result = await self._session.execute(
            select(HousePhotoRecord)
            .where(HousePhotoRecord.house_id == house_id)
            .order_by(HousePhotoRecord.sort_order, HousePhotoRecord.created_at)
        )
        return [to_house_photo_entity(m) for m in result.scalars().all()]

    async def get_by_id(self, photo_id: UUID) -> HousePhotoEntity | None:
        model = await self._session.get(HousePhotoRecord, photo_id)
        return to_house_photo_entity(model) if model else None

    async def create(
        self,
        house_id: UUID,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
        alt_text: str,
        sort_order: int,
    ) -> HousePhotoEntity:
        model = HousePhotoRecord(
            house_id=house_id,
            s3_key=s3_key,
            original_filename=original_filename,
            file_size_bytes=file_size_bytes,
            alt_text=alt_text,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_house_photo_entity(model)

    async def delete(self, photo_id: UUID) -> None:
        model = await self._session.get(HousePhotoRecord, photo_id)
        if model:
            await self._session.delete(model)

    async def list_s3_keys_by_house(self, house_id: UUID) -> list[str]:
        result = await self._session.execute(
            select(HousePhotoRecord.s3_key).where(HousePhotoRecord.house_id == house_id)
        )
        return list(result.scalars().all())


class SqlAlchemyHouseVideoRepository(SqlAlchemyAsyncRepository, HouseVideoRepository):
    async def list_by_house(self, house_id: UUID) -> list[HouseVideoEntity]:
        result = await self._session.execute(
            select(HouseVideoRecord)
            .where(HouseVideoRecord.house_id == house_id)
            .order_by(HouseVideoRecord.sort_order, HouseVideoRecord.created_at)
        )
        return [to_house_video_entity(m) for m in result.scalars().all()]

    async def get_by_id(self, video_id: UUID) -> HouseVideoEntity | None:
        model = await self._session.get(HouseVideoRecord, video_id)
        return to_house_video_entity(model) if model else None

    async def create(
        self,
        house_id: UUID,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
        title: str,
        sort_order: int,
    ) -> HouseVideoEntity:
        model = HouseVideoRecord(
            house_id=house_id,
            s3_key=s3_key,
            original_filename=original_filename,
            file_size_bytes=file_size_bytes,
            title=title,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_house_video_entity(model)

    async def delete(self, video_id: UUID) -> None:
        model = await self._session.get(HouseVideoRecord, video_id)
        if model:
            await self._session.delete(model)

    async def list_s3_keys_by_house(self, house_id: UUID) -> list[str]:
        result = await self._session.execute(
            select(HouseVideoRecord.s3_key).where(HouseVideoRecord.house_id == house_id)
        )
        return list(result.scalars().all())


class SqlAlchemyHouseVideoLinkRepository(SqlAlchemyAsyncRepository, HouseVideoLinkRepository):
    async def list_by_house(self, house_id: UUID) -> list[HouseVideoLinkEntity]:
        result = await self._session.execute(
            select(HouseVideoLinkRecord)
            .where(HouseVideoLinkRecord.house_id == house_id)
            .order_by(HouseVideoLinkRecord.sort_order, HouseVideoLinkRecord.created_at)
        )
        return [to_house_video_link_entity(m) for m in result.scalars().all()]

    async def get_by_id(self, link_id: UUID) -> HouseVideoLinkEntity | None:
        model = await self._session.get(HouseVideoLinkRecord, link_id)
        return to_house_video_link_entity(model) if model else None

    async def create(
        self,
        house_id: UUID,
        platform: str,
        url: str,
        title: str,
        sort_order: int,
    ) -> HouseVideoLinkEntity:
        model = HouseVideoLinkRecord(
            house_id=house_id,
            platform=platform,
            url=url,
            title=title,
            sort_order=sort_order,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_house_video_link_entity(model)

    async def delete(self, link_id: UUID) -> None:
        model = await self._session.get(HouseVideoLinkRecord, link_id)
        if model:
            await self._session.delete(model)


class SqlAlchemyHouseModelRepository(SqlAlchemyAsyncRepository, HouseModelRepository):
    async def list_all(self) -> list[HouseModelEntity]:
        result = await self._session.execute(
            select(HouseModelModel).order_by(HouseModelModel.created_at.desc())
        )
        return [to_house_model_entity(m) for m in result.scalars().all()]

    async def get_by_id(self, model_id: UUID) -> HouseModelEntity | None:
        model = await self._session.get(HouseModelModel, model_id)
        return to_house_model_entity(model) if model else None

    async def get_by_house_id(self, house_id: UUID) -> HouseModelEntity | None:
        result = await self._session.execute(
            select(HouseModelModel).where(HouseModelModel.house_id == house_id)
        )
        model = result.scalar_one_or_none()
        return to_house_model_entity(model) if model else None

    async def create(
        self,
        house_id: UUID,
        name: str,
        description: str,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
    ) -> HouseModelEntity:
        model = HouseModelModel(
            house_id=house_id,
            name=name,
            description=description,
            s3_key=s3_key,
            original_filename=original_filename,
            file_size_bytes=file_size_bytes,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return to_house_model_entity(model)

    async def delete(self, model_id: UUID) -> None:
        model = await self._session.get(HouseModelModel, model_id)
        if model:
            await self._session.delete(model)

    async def get_s3_key_by_house(self, house_id: UUID) -> str | None:
        result = await self._session.execute(
            select(HouseModelModel.s3_key).where(HouseModelModel.house_id == house_id)
        )
        return result.scalar_one_or_none()
