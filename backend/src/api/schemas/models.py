from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HouseModelOut(BaseModel):
    id: UUID
    name: str
    description: str
    glb: str
    original_filename: str
    file_size_bytes: int
    created_at: datetime


class HouseModelCreateForm(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
