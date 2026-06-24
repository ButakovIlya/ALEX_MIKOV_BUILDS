from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class GeocodingSuggestion:
    display_name: str
    latitude: Decimal
    longitude: Decimal
    city: str | None
    street: str | None
    house_number: str | None
