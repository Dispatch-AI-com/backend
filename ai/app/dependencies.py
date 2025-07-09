from typing import Annotated, Optional
from fastapi import Header, HTTPException, Depends

from .core.config import get_settings, Settings


def get_app_settings() -> Settings:
    """Get application settings."""
    return get_settings()


async def get_token_header(
    x_token: Annotated[str, Header()],
    settings: Settings = Depends(get_app_settings)
):
    """Validate token header if authentication is enabled."""
    if not settings.enable_auth:
        return x_token
    
    if x_token != settings.auth_token:
        raise HTTPException(status_code=400, detail="X-Token header invalid")
    
    return x_token


async def get_query_token(
    token: str,
    settings: Settings = Depends(get_app_settings)
):
    """Validate query token if authentication is enabled."""
    if not settings.enable_auth:
        return token
    
    if token != "jessica":  # Keep original behavior for now
        raise HTTPException(status_code=400, detail="No Jessica token provided")
    
    return token


# Optional authentication dependency
async def optional_auth(
    x_token: Annotated[Optional[str], Header()] = None,
    settings: Settings = Depends(get_app_settings)
):
    """Optional authentication dependency."""
    if settings.enable_auth and x_token:
        return await get_token_header(x_token, settings)
    return None
