from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from infrastructure.repositories.alchemy.address import SqlAlchemyAddressCatalogRepository
from infrastructure.repositories.alchemy.house_model import (
    SqlAlchemyAdminUserRepository,
    SqlAlchemyHouseModelRepository,
    SqlAlchemyHousePhotoRepository,
    SqlAlchemyHouseRepository,
    SqlAlchemyHouseVideoLinkRepository,
    SqlAlchemyHouseVideoRepository,
)
from infrastructure.uow.base import UnitOfWork


class SqlAlchemyUnitOfWork(UnitOfWork):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory
        self._session: AsyncSession | None = None

    async def __aenter__(self) -> "SqlAlchemyUnitOfWork":
        self._session = self._session_factory()
        self.admin_users = SqlAlchemyAdminUserRepository(self._session)
        self.houses = SqlAlchemyHouseRepository(self._session)
        self.house_photos = SqlAlchemyHousePhotoRepository(self._session)
        self.house_videos = SqlAlchemyHouseVideoRepository(self._session)
        self.house_video_links = SqlAlchemyHouseVideoLinkRepository(self._session)
        self.house_models = SqlAlchemyHouseModelRepository(self._session)
        self.address_catalog = SqlAlchemyAddressCatalogRepository(self._session)
        await super().__aenter__()
        return self

    async def commit(self) -> None:
        if self._session:
            await self._session.commit()

    async def rollback(self) -> None:
        if self._session:
            await self._session.rollback()

    async def shutdown(self) -> None:
        if self._session:
            await self._session.close()
            self._session = None
