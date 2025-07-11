from fastapi import APIRouter
from .v1 import chat, call_summary, health

# Create main API router
api_router = APIRouter()

# Include v1 routes
api_router.include_router(chat.router, prefix="/v1", tags=["v1-chat"])
api_router.include_router(call_summary.router, prefix="/v1", tags=["v1-summary"])
api_router.include_router(health.router, prefix="/v1", tags=["v1-health"])