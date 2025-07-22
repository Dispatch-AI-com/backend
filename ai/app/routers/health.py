# ai/app/routers/health.py
from fastapi import APIRouter, HTTPException, Query
from app.client.mcp_client import call_tool, list_tools

router = APIRouter(
    prefix="/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)


@router.get("/ping", operation_id="health_ping")
async def ping():
    return {"message": "pong！"}

@router.get("/mcp_ping")
async def mcp_ping(show_tools: bool = Query(False)):
    try:
        pong = await call_tool("health_ping", {})
        if show_tools:
            tools = await list_tools()
            return {"pong": pong, "tools": tools}
        return pong
    except Exception as e:
        raise HTTPException(502, repr(e))
