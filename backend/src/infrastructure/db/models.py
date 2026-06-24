import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AdminUserModel(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class HouseRecord(Base):
    __tablename__ = "houses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(255), default="")
    area_sqm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    avatar_s3_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    address: Mapped[str] = mapped_column(Text, default="")
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    object_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    readiness: Mapped[str | None] = mapped_column(String(32), nullable=True)
    land_category: Mapped[str | None] = mapped_column(String(32), nullable=True)
    build_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wall_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    roof_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    floors_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rooms_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    plot_area_sotka: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    price_rub: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    cadastral_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    distance_to_city_km: Mapped[float | None] = mapped_column(Numeric(6, 1), nullable=True)
    ceiling_height_m: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    renovation: Mapped[str | None] = mapped_column(String(32), nullable=True)
    parking: Mapped[str | None] = mapped_column(String(32), nullable=True)
    electricity: Mapped[str | None] = mapped_column(String(16), nullable=True)
    gas: Mapped[str | None] = mapped_column(String(32), nullable=True)
    heating: Mapped[str | None] = mapped_column(String(16), nullable=True)
    water_supply: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sewage: Mapped[str | None] = mapped_column(String(32), nullable=True)
    has_bathhouse: Mapped[bool] = mapped_column(Boolean, default=False)
    has_pool: Mapped[bool] = mapped_column(Boolean, default=False)
    has_terrace: Mapped[bool] = mapped_column(Boolean, default=False)
    bathroom_in_house: Mapped[bool] = mapped_column(Boolean, default=False)
    bathroom_outside: Mapped[bool] = mapped_column(Boolean, default=False)
    has_wifi: Mapped[bool] = mapped_column(Boolean, default=False)
    has_tv: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_asphalt: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_public_stop: Mapped[bool] = mapped_column(Boolean, default=False)
    transport_railway: Mapped[bool] = mapped_column(Boolean, default=False)
    infra_shop: Mapped[bool] = mapped_column(Boolean, default=False)
    infra_pharmacy: Mapped[bool] = mapped_column(Boolean, default=False)
    infra_kindergarten: Mapped[bool] = mapped_column(Boolean, default=False)
    infra_school: Mapped[bool] = mapped_column(Boolean, default=False)
    is_mortgage_available: Mapped[bool] = mapped_column(Boolean, default=False)
    is_share_sale: Mapped[bool] = mapped_column(Boolean, default=False)
    is_auction: Mapped[bool] = mapped_column(Boolean, default=False)
    has_fence: Mapped[bool] = mapped_column(Boolean, default=False)
    has_security: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    photos: Mapped[list["HousePhotoRecord"]] = relationship(back_populates="house", cascade="all, delete-orphan")
    videos: Mapped[list["HouseVideoRecord"]] = relationship(back_populates="house", cascade="all, delete-orphan")
    video_links: Mapped[list["HouseVideoLinkRecord"]] = relationship(
        back_populates="house", cascade="all, delete-orphan"
    )
    glb_model: Mapped["HouseModelModel | None"] = relationship(back_populates="house", cascade="all, delete-orphan")


class HousePhotoRecord(Base):
    __tablename__ = "house_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("houses.id", ondelete="CASCADE"))
    s3_key: Mapped[str] = mapped_column(String(512), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)
    alt_text: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    house: Mapped["HouseRecord"] = relationship(back_populates="photos")


class HouseVideoRecord(Base):
    __tablename__ = "house_videos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("houses.id", ondelete="CASCADE"))
    s3_key: Mapped[str] = mapped_column(String(512), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)
    title: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    house: Mapped["HouseRecord"] = relationship(back_populates="videos")


class HouseVideoLinkRecord(Base):
    __tablename__ = "house_video_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("houses.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(32))
    url: Mapped[str] = mapped_column(String(512))
    title: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    house: Mapped["HouseRecord"] = relationship(back_populates="video_links")


class HouseModelModel(Base):
    __tablename__ = "house_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    house_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("houses.id", ondelete="CASCADE"), unique=True, nullable=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    s3_key: Mapped[str] = mapped_column(String(512), unique=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    file_size_bytes: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    house: Mapped["HouseRecord | None"] = relationship(back_populates="glb_model")


class AddressCatalogRecord(Base):
    __tablename__ = "address_catalog"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(Text)
    search_text: Mapped[str] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(Text, nullable=True)
    street: Mapped[str | None] = mapped_column(Text, nullable=True)
    house_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6))
    longitude: Mapped[float] = mapped_column(Numeric(9, 6))
    osm_type: Mapped[str] = mapped_column(String(16))
    osm_id: Mapped[int] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(String(16), default="osm")
