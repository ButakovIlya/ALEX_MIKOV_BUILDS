from contextlib import asynccontextmanager
from typing import AsyncIterator

from dependency_injector import containers, providers

from config.settings import Settings
from infrastructure.db.database import Database
from infrastructure.s3_storage import S3Storage
from infrastructure.uow.alchemy import SqlAlchemyUnitOfWork


class DBContainer(containers.DeclarativeContainer):
    settings = providers.Dependency(instance_of=Settings)
    database = providers.Singleton(Database, settings=settings)
    session_factory = database.provided.session_factory


class RootContainer(containers.DeclarativeContainer):
    settings = providers.Singleton(Settings)
    db = providers.Container(DBContainer, settings=settings)
    uow = providers.Factory(SqlAlchemyUnitOfWork, session_factory=db.session_factory)
    s3 = providers.Singleton(S3Storage, settings=settings)


class Container(RootContainer):
    @staticmethod
    @asynccontextmanager
    async def lifespan(wireable_modules: list[object]) -> AsyncIterator[None]:
        container = Container()
        container.wire(modules=wireable_modules)
        container.s3().ensure_bucket()
        await _ensure_admin(container)
        try:
            yield
        finally:
            await container.db.database().dispose()
            container.unwire()


async def _ensure_admin(container: Container) -> None:
    settings = container.settings()
    async with container.uow()(autocommit=True) as uw:
        existing = await uw.admin_users.get_by_username(settings.admin_username)
        if existing is None:
            from infrastructure.auth import hash_password

            await uw.admin_users.create(settings.admin_username, hash_password(settings.admin_password))
