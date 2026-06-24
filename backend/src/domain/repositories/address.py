from abc import ABC, abstractmethod

from domain.entities.address import AddressCatalogEntity


class AddressCatalogRepository(ABC):
    @abstractmethod
    async def search(self, query: str, limit: int) -> list[AddressCatalogEntity]: ...

    @abstractmethod
    async def bulk_insert(self, rows: list[dict]) -> None: ...
