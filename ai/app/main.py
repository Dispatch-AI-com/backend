from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health
from .routers import ai
from .routers import email
from .routers import calendar

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


api_router.include_router(health.router)
api_router.include_router(ai.router)
api_router.include_router(email.router)
api_router.include_router(calendar.router)

app.include_router(api_router)
