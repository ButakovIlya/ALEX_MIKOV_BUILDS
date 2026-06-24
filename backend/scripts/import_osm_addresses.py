#!/usr/bin/env python3
"""Import OSM addresses from Geofabrik PBF into address_catalog.

Perm (default project region):
  https://download.geofabrik.de/russia/volga-fed-district-latest.osm.pbf (~900 MB)
  or trim Russia extract with osmium:
  osmium extract -b 55.75,57.85,56.65,58.25 russia-latest.osm.pbf -o data/perm.osm.pbf

Usage:
  poetry run python scripts/import_osm_addresses.py --pbf data/perm.osm.pbf --region perm --truncate
"""
from __future__ import annotations

import argparse
import sys
import time
import uuid
from pathlib import Path
from typing import Callable

import osmium
import psycopg2
from psycopg2.extras import execute_values

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from config.settings import Settings  # noqa: E402

BATCH_SIZE = 5000
PROGRESS_EVERY = 10_000

# west, south, east, north — Perm city + ближайшая agglomeration
REGIONS: dict[str, dict[str, object]] = {
    "perm": {
        "bbox": (55.75, 57.85, 56.65, 58.25),  # west, south, east, north
    },
}


def log(msg: str) -> None:
    print(msg, flush=True)


def psycopg2_dsn() -> str:
    return Settings().database_url.replace("postgresql+psycopg2://", "postgresql://")


def normalize(text: str) -> str:
    return text.strip().lower().replace("ё", "е")


def in_bbox(lon: float, lat: float, bbox: tuple[float, float, float, float]) -> bool:
    west, south, east, north = bbox
    return west <= lon <= east and south <= lat <= north


def build_region_filter(region: str) -> Callable[[float, float, dict[str, str]], bool]:
    if region not in REGIONS:
        raise SystemExit(f"Unknown region {region!r}. Available: {', '.join(REGIONS)}")

    cfg = REGIONS[region]
    bbox = cfg["bbox"]

    def accept(lat: float, lon: float, tags: dict[str, str]) -> bool:
        return in_bbox(lon, lat, bbox)  # type: ignore[arg-type]

    return accept


def build_display_name(tags: dict[str, str]) -> str | None:
    if full := tags.get("addr:full"):
        return full.strip()
    parts: list[str] = []
    for key in ("addr:city", "addr:town", "addr:village", "addr:hamlet", "addr:suburb"):
        if tags.get(key):
            parts.append(tags[key])
            break
    street = tags.get("addr:street") or tags.get("addr:place")
    if street:
        parts.append(street)
    hn = tags.get("addr:housenumber")
    if hn:
        parts.append(hn)
    if not parts:
        return None
    return ", ".join(parts)


class AddressHandler(osmium.SimpleHandler):
    def __init__(self, *, accept: Callable[[float, float, dict[str, str]], bool] | None = None) -> None:
        super().__init__()
        self.accept = accept
        self.batch: list[tuple] = []
        self.inserted = 0
        self.skipped = 0
        self.addr_nodes = 0
        self.filtered_out = 0
        self.started = time.monotonic()
        self.conn = psycopg2.connect(psycopg2_dsn())
        self.conn.autocommit = False
        self.cur = self.conn.cursor()

    def close(self) -> None:
        self.flush()
        self.cur.close()
        self.conn.close()

    def _maybe_log_progress(self) -> None:
        if self.inserted > 0 and self.inserted % PROGRESS_EVERY == 0:
            elapsed = time.monotonic() - self.started
            rate = self.inserted / elapsed if elapsed else 0
            log(
                f"[{elapsed:,.0f}s] inserted {self.inserted:,} | "
                f"skipped dup {self.skipped:,} | filtered {self.filtered_out:,} | "
                f"addr nodes {self.addr_nodes:,} | {rate:,.0f} rows/s"
            )

    def flush(self) -> None:
        if not self.batch:
            return
        batch_len = len(self.batch)
        execute_values(
            self.cur,
            """
            INSERT INTO address_catalog (
                id, display_name, search_text, city, region, street, house_number,
                latitude, longitude, osm_type, osm_id, source
            ) VALUES %s
            ON CONFLICT (osm_type, osm_id) DO NOTHING
            """,
            self.batch,
        )
        self.conn.commit()
        added = self.cur.rowcount
        self.inserted += added
        self.skipped += batch_len - added
        self.batch.clear()
        self._maybe_log_progress()

    def _append(self, osm_type: str, osm_id: int, lat: float, lon: float, tags: dict[str, str]) -> None:
        if self.accept and not self.accept(lat, lon, tags):
            self.filtered_out += 1
            return
        display = build_display_name(tags)
        if not display:
            return
        city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village")
        region = tags.get("addr:state") or tags.get("addr:region")
        street = tags.get("addr:street") or tags.get("addr:place")
        house_number = tags.get("addr:housenumber")
        self.batch.append(
            (
                str(uuid.uuid4()),
                display,
                normalize(display),
                city,
                region,
                street,
                house_number,
                lat,
                lon,
                osm_type,
                osm_id,
                "osm",
            )
        )
        if len(self.batch) >= BATCH_SIZE:
            self.flush()

    def node(self, n: osmium.osm.Node) -> None:
        tags = {t.k: t.v for t in n.tags}
        if not any(k.startswith("addr:") for k in tags):
            return
        self.addr_nodes += 1
        if self.addr_nodes % 100_000 == 0:
            elapsed = time.monotonic() - self.started
            log(
                f"[{elapsed:,.0f}s] scanned {self.addr_nodes:,} addr-nodes, "
                f"inserted {self.inserted:,}, filtered {self.filtered_out:,}…"
            )
        self._append("node", n.id, n.location.lat, n.location.lon, tags)


def truncate_catalog(conn: psycopg2.extensions.connection) -> None:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE address_catalog")
    conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import OSM addresses into Postgres")
    parser.add_argument("--pbf", required=True, help="Path to .osm.pbf file")
    parser.add_argument(
        "--region",
        default="perm",
        choices=[*REGIONS.keys()],
        help="Geographic filter preset (default: perm)",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Clear address_catalog before import",
    )
    args = parser.parse_args()
    pbf = Path(args.pbf)
    if not pbf.is_file():
        raise SystemExit(f"File not found: {pbf}")

    accept = build_region_filter(args.region)
    bbox = REGIONS[args.region]["bbox"]
    size_gb = pbf.stat().st_size / (1024**3)
    settings = Settings()
    log(f"PBF: {pbf} ({size_gb:.2f} GB)")
    log(f"Region: {args.region} bbox={bbox}")
    log(f"DB: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")
    log(f"Batch size {BATCH_SIZE}, progress every {PROGRESS_EVERY:,} inserts")

    if args.truncate:
        conn = psycopg2.connect(psycopg2_dsn())
        try:
            truncate_catalog(conn)
            log("address_catalog truncated")
        finally:
            conn.close()

    log("Parsing…")

    handler = AddressHandler(accept=accept)
    try:
        handler.apply_file(str(pbf), locations=False)
    finally:
        handler.close()

    elapsed = time.monotonic() - handler.started
    log(
        f"Done in {elapsed / 60:.1f} min — inserted {handler.inserted:,}, "
        f"skipped dup {handler.skipped:,}, filtered {handler.filtered_out:,}, "
        f"addr-nodes {handler.addr_nodes:,}"
    )


if __name__ == "__main__":
    main()
