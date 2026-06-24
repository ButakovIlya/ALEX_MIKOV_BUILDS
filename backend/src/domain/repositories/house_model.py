from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.house_model import (
    AdminUserEntity,
    HouseEntity,
    HouseModelEntity,
    HousePhotoEntity,
    HouseVideoEntity,
    HouseVideoLinkEntity,
)
from domain.entities.house_write import HouseWriteData


class AdminUserRepository(ABC):
    @abstractmethod
    async def get_by_username(self, username: str) -> AdminUserEntity | None: ...

    @abstractmethod
    async def create(self, username: str, password_hash: str) -> AdminUserEntity: ...


class HouseRepository(ABC):
    @abstractmethod
    async def list_published(self) -> list[HouseEntity]: ...

    @abstractmethod
    async def list_all(self) -> list[HouseEntity]: ...

    @abstractmethod
    async def get_by_id(self, house_id: UUID) -> HouseEntity | None: ...

    @abstractmethod
    async def create(self, data: HouseWriteData) -> HouseEntity: ...

    @abstractmethod
    async def update(self, house_id: UUID, data: HouseWriteData) -> HouseEntity | None: ...

    @abstractmethod
    async def set_avatar_s3_key(self, house_id: UUID, avatar_s3_key: str | None) -> HouseEntity | None: ...

    @abstractmethod
    async def delete(self, house_id: UUID) -> None: ...


class HousePhotoRepository(ABC):
    @abstractmethod
    async def list_by_house(self, house_id: UUID) -> list[HousePhotoEntity]: ...

    @abstractmethod
    async def get_by_id(self, photo_id: UUID) -> HousePhotoEntity | None: ...

    @abstractmethod
    async def create(
        self,
        house_id: UUID,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
        alt_text: str,
        sort_order: int,
    ) -> HousePhotoEntity: ...

    @abstractmethod
    async def delete(self, photo_id: UUID) -> None: ...

    @abstractmethod
    async def list_s3_keys_by_house(self, house_id: UUID) -> list[str]: ...


class HouseVideoRepository(ABC):
    @abstractmethod
    async def list_by_house(self, house_id: UUID) -> list[HouseVideoEntity]: ...

    @abstractmethod
    async def get_by_id(self, video_id: UUID) -> HouseVideoEntity | None: ...

    @abstractmethod
    async def create(
        self,
        house_id: UUID,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
        title: str,
        sort_order: int,
    ) -> HouseVideoEntity: ...

    @abstractmethod
    async def delete(self, video_id: UUID) -> None: ...

    @abstractmethod
    async def list_s3_keys_by_house(self, house_id: UUID) -> list[str]: ...


class HouseVideoLinkRepository(ABC):
    @abstractmethod
    async def list_by_house(self, house_id: UUID) -> list[HouseVideoLinkEntity]: ...

    @abstractmethod
    async def get_by_id(self, link_id: UUID) -> HouseVideoLinkEntity | None: ...

    @abstractmethod
    async def create(
        self,
        house_id: UUID,
        platform: str,
        url: str,
        title: str,
        sort_order: int,
    ) -> HouseVideoLinkEntity: ...

    @abstractmethod
    async def delete(self, link_id: UUID) -> None: ...


class HouseModelRepository(ABC):
    @abstractmethod
    async def list_all(self) -> list[HouseModelEntity]: ...

    @abstractmethod
    async def get_by_id(self, model_id: UUID) -> HouseModelEntity | None: ...

    @abstractmethod
    async def get_by_house_id(self, house_id: UUID) -> HouseModelEntity | None: ...

    @abstractmethod
    async def create(
        self,
        house_id: UUID,
        name: str,
        description: str,
        s3_key: str,
        original_filename: str,
        file_size_bytes: int,
    ) -> HouseModelEntity: ...

    @abstractmethod
    async def delete(self, model_id: UUID) -> None: ...

    @abstractmethod
    async def get_s3_key_by_house(self, house_id: UUID) -> str | None: ...
