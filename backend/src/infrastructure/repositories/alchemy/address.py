import uuid
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert

from domain.entities.address import AddressCatalogEntity
from domain.repositories.address import AddressCatalogRepository
from infrastructure.db.models import AddressCatalogRecord
from infrastructure.repositories.alchemy.base import SqlAlchemyAsyncRepository


def to_address_entity(model: AddressCatalogRecord) -> AddressCatalogEntity:
    return AddressCatalogEntity(
        id=model.id,
        display_name=model.display_name,
        search_text=model.search_text,
        city=model.city,
        region=model.region,
        street=model.street,
        house_number=model.house_number,
        latitude=model.latitude,
        longitude=model.longitude,
        osm_type=model.osm_type,
        osm_id=model.osm_id,
        source=model.source,
    )


class SqlAlchemyAddressCatalogRepository(SqlAlchemyAsyncRepository, AddressCatalogRepository):
    async def search(self, query: str, limit: int) -> list[AddressCatalogEntity]:
        normalized = query.strip().lower().replace("ё", "е")
        if len(normalized) < 3:
            return []
        stmt = (
            select(AddressCatalogRecord)
            .where(text("search_text % :q"))
            .order_by(text("similarity(search_text, :q) DESC"))
            .limit(limit)
        )
        result = await self._session.execute(stmt, {"q": normalized})
        return [to_address_entity(m) for m in result.scalars().all()]

    async def bulk_insert(self, rows: list[dict]) -> None:
        if not rows:
            return
        for row in rows:
            row.setdefault("id", uuid.uuid4())
            row.setdefault("source", "osm")
        stmt = insert(AddressCatalogRecord).values(rows)
        stmt = stmt.on_conflict_do_nothing(index_elements=["osm_type", "osm_id"])
        await self._session.execute(stmt)
