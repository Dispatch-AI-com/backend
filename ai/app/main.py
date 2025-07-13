from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp.server import FastApiMCP
from app.routers import routers as all_routers

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
for r in all_routers:
    api_router.include_router(r)

app.include_router(api_router)

mcp = FastApiMCP(
    app,        
    name="Dispatch AI MCP"
)
mcp.mount()
