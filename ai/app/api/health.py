from fastapi import APIRouter
from infrastructure.redis_client import get_redis
from fastapi import Query
from fastapi.responses import PlainTextResponse
from fastapi.exceptions import HTTPException
from client.mcp_client import call_tool, list_tools
from utils.mcp_parse import parse_tool_result, to_dict


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/ping", operation_id="health_ping")
async def ping():
    return {"message": "pong！"}


@router.get("/redis")
async def redis():
    r = get_redis()
    return {"message": "pong！", "redis": r.ping()}
    
@router.get("/mcp_ping")
async def mcp_ping(
    show_tools: bool = Query(False),
    plain: bool = Query(False, description="是否用纯文本按行返回")
):
    try:
        raw = await call_tool("health_ping", {})
        pong = parse_tool_result(raw)

        if not show_tools:
            return pong

        tools_raw = await list_tools()
        tools_dict = to_dict(tools_raw)
        tools = tools_dict.get("tools", [])

        lines = []
        for t in tools:
            name = t.get("name", "")
            desc_first = (t.get("description") or "").splitlines()[0]
            lines.append(f"{name} - {desc_first}")

        if plain:
            return PlainTextResponse("\n".join(lines))

        return {"pong": pong, "tools_lines": lines}

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(502, repr(e))