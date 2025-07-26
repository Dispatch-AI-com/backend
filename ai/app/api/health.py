from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/ping")
async def ping():
    return {"message": "pong！"}
