from domain.repositories.address import AddressCatalogRepository
from domain.repositories.house_model import (
    AdminUserRepository,
    HouseModelRepository,
    HousePhotoRepository,
    HouseRepository,
    HouseVideoLinkRepository,
    HouseVideoRepository,
)


class UnitOfWork:
    admin_users: AdminUserRepository
    houses: HouseRepository
    house_photos: HousePhotoRepository
    house_videos: HouseVideoRepository
    house_video_links: HouseVideoLinkRepository
    house_models: HouseModelRepository
    address_catalog: AddressCatalogRepository
    _autocommit: bool = False

    def __call__(self, *args, autocommit: bool = False, **kwargs) -> "UnitOfWork":
        self._autocommit = autocommit
        return self

    async def __aenter__(self) -> "UnitOfWork":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type:
            await self.rollback()
        elif self._autocommit:
            await self.commit()
        await self.shutdown()

    async def commit(self) -> None: ...

    async def rollback(self) -> None: ...

    async def shutdown(self) -> None: ...
