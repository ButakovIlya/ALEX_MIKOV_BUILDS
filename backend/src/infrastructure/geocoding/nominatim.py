"""OpenStreetMap Nominatim geocoding (free, no API key).

Usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Valid User-Agent required
- Max ~1 request per second
"""

from __future__ import annotations

import asyncio
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal
from typing import Any

from domain.entities.geocoding import GeocodingSuggestion
from config.settings import Settings

_RATE_LOCK = asyncio.Lock()
_LAST_REQUEST_AT = 0.0
_MIN_INTERVAL_SEC = 1.05


def _pick_address_field(address: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = address.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _to_suggestion(item: dict[str, Any]) -> GeocodingSuggestion:
    address = item.get("address") if isinstance(item.get("address"), dict) else {}
    return GeocodingSuggestion(
        display_name=str(item.get("display_name") or ""),
        latitude=Decimal(str(item["lat"])),
        longitude=Decimal(str(item["lon"])),
        city=_pick_address_field(address, "city", "town", "village", "municipality", "hamlet"),
        street=_pick_address_field(address, "road", "street", "pedestrian", "footway"),
        house_number=_pick_address_field(address, "house_number"),
    )


def _search_sync(settings: Settings, query: str, limit: int) -> list[GeocodingSuggestion]:
    params: dict[str, str] = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": "1",
        "limit": str(limit),
        "countrycodes": settings.nominatim_country_codes,
        "accept-language": "ru",
    }
    if settings.nominatim_viewbox:
        params["viewbox"] = settings.nominatim_viewbox
        params["bounded"] = "0"

    url = f"{settings.nominatim_base_url.rstrip('/')}/search?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": settings.nominatim_user_agent,
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Nominatim HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError("Nominatim unavailable") from exc

    if not isinstance(payload, list):
        return []

    return [_to_suggestion(item) for item in payload if isinstance(item, dict) and item.get("lat") and item.get("lon")]


async def search_addresses(settings: Settings, query: str, limit: int) -> list[GeocodingSuggestion]:
    global _LAST_REQUEST_AT

    async with _RATE_LOCK:
        now = time.monotonic()
        wait = _MIN_INTERVAL_SEC - (now - _LAST_REQUEST_AT)
        if wait > 0:
            await asyncio.sleep(wait)
        _LAST_REQUEST_AT = time.monotonic()

    return await asyncio.to_thread(_search_sync, settings, query.strip(), limit)
