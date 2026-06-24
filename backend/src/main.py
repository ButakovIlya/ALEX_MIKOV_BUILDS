from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import admin_houses, addresses, auth, houses, models
from config.containers import Container
from config.settings import Settings

_WIRE_MODULES = [auth, houses, admin_houses, models, addresses]


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with Container.lifespan(wireable_modules=_WIRE_MODULES):
        yield


def create_app() -> FastAPI:
    settings = Settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(houses.router, prefix="/api/v1")
    app.include_router(admin_houses.router, prefix="/api/v1")
    app.include_router(models.router, prefix="/api/v1")
    app.include_router(addresses.router, prefix="/api/v1")
    return app


app = create_app()
