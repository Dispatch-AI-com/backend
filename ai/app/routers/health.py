# ai/app/routers/health.py
from fastapi import APIRouter, HTTPException
from datetime import datetime
import os

router = APIRouter(
    prefix="/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)

@router.get("/ping")
async def ping():
    return {"message": "pong！"}
