# ai/app/routers/health.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)


@router.get("/ping")
async def ping():
    return {"message": "pong！"}
