from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Mikov Cottages API"
    debug: bool = False

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "mikov"
    postgres_password: str = "mikov"
    postgres_db: str = "mikov"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    admin_username: str = "admin"
    admin_password: str = "admin"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_endpoint_url: str | None = None
    s3_public_base_path: str = "/storage"
    s3_presign_expires_seconds: int = 3600
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "models"
    s3_region: str = "us-east-1"
    s3_use_ssl: bool = False

    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = "mikov-cottages/1.0 (local-dev)"
    nominatim_country_codes: str = "ru"
    # Perm krai bias: west, north, east, south (lon/lat)
    nominatim_viewbox: str | None = "57.85,56.65,58.25,55.75"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_async(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )
