# Mikov Cottages API

FastAPI backend: houses, photos, 3D models (MinIO), PostgreSQL, JWT admin.

## Setup

```bash
cd backend
poetry install
poetry run poe migrate
poetry run poe dev
```

## Env

Copy root `.env.example` or set `POSTGRES_*`, `JWT_SECRET`, `S3_*`, `ADMIN_*`.

Frontend: `VITE_YANDEX_MAPS_API_KEY` in `frontend/.env` (Yandex Maps JS API).

## Address catalog (OSM)

Autocomplete uses local Postgres table `address_catalog` (migration `005`).

Project default: **Perm city** (~50–150k addresses, minutes not hours).

1. Run migrations: `poetry run poe migrate`
2. Download extract (pick one):
   - **Fast:** trim bbox from Russia (~50 MB):
     ```bash
     osmium extract -b 55.75,57.85,56.65,58.25 russia-latest.osm.pbf -o data/perm.osm.pbf
     ```
   - **Medium:** Volga FD (~900 MB): https://download.geofabrik.de/russia/volga-fed-district-latest.osm.pbf
3. Import:

```bash
poetry install --with dev
poetry run python -u scripts/import_osm_addresses.py --pbf data/perm.osm.pbf --region perm --truncate
```

`--region perm` — bbox Perm city. `--truncate` — wipe old Russia rows before import.

Search API: `GET /api/v1/addresses/search?q=гайвинский&limit=10` (min 3 chars).

## House specs

Migration `004` adds property fields (object type, utilities, price, geo, etc.). Admin and public API return full `HouseOut` with specs.
