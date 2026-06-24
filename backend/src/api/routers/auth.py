from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.schemas.models import LoginRequest, TokenOut
from config.containers import Container
from config.settings import Settings
from domain.exceptions import AuthError
from infrastructure.auth import create_access_token, verify_password
from infrastructure.uow.alchemy import SqlAlchemyUnitOfWork

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


@router.post("/login", response_model=TokenOut)
@inject
async def login(
    body: LoginRequest,
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    settings: Settings = Depends(Provide[Container.settings]),
) -> TokenOut:
    async with uow() as uw:
        user = await uw.admin_users.get_by_username(body.username)
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(settings, user.username)
    return TokenOut(access_token=token)


@inject
async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    uow: SqlAlchemyUnitOfWork = Depends(Provide[Container.uow]),
    settings: Settings = Depends(Provide[Container.settings]),
) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        username = decode_token_safe(settings, credentials.credentials)
    except AuthError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from None
    async with uow() as uw:
        user = await uw.admin_users.get_by_username(username)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return username


def decode_token_safe(settings: Settings, token: str) -> str:
    from infrastructure.auth import decode_token

    return decode_token(settings, token)
