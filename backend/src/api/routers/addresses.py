from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Query

from api.schemas.addresses import AddressSearchOut
from config.containers import Container
from config.settings import Settings
from infrastructure.geocoding.nominatim import search_addresses as nominatim_search

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("/search", response_model=list[AddressSearchOut])
@inject
async def search_addresses(
    q: str = Query(min_length=3, max_length=200),
    limit: int = Query(default=10, ge=1, le=20),
    settings: Settings = Depends(Provide[Container.settings]),
) -> list[AddressSearchOut]:
    try:
        rows = await nominatim_search(settings, q, limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return [
        AddressSearchOut(
            display_name=row.display_name,
            latitude=row.latitude,
            longitude=row.longitude,
            city=row.city,
            street=row.street,
            house_number=row.house_number,
        )
        for row in rows
    ]
