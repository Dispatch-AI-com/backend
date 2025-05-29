from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import items

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(items.router)
