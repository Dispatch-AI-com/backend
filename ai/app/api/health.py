from fastapi import APIRouter
from app.infrastructure.redis_client import get_redis


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/ping", operation_id="health_ping")
async def ping():
    return {"message": "pong！"}


@router.get("/redis")
async def redis():
    r = get_redis()
    return {"message": "pong！", "redis": r.ping()}


