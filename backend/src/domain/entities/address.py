from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID


@dataclass
class AddressCatalogEntity:
    id: UUID
    display_name: str
    search_text: str
    city: str | None
    region: str | None
    street: str | None
    house_number: str | None
    latitude: Decimal
    longitude: Decimal
    osm_type: str
    osm_id: int
    source: str
