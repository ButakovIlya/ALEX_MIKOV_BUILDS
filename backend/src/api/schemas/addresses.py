from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AddressSearchOut(BaseModel):
    display_name: str
    latitude: Decimal
    longitude: Decimal
    city: str | None
    street: str | None
    house_number: str | None
