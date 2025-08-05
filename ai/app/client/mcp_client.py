# app/client/mcp_client.py
from contextlib import asynccontextmanager
from typing import Any, Dict, List

from mcp.client.sse import sse_client
from mcp import ClientSession

MCP_URL = "http://127.0.0.1:8000/mcp"


@asynccontextmanager
async def open_session():
    async with sse_client(MCP_URL) as (recv, send):
        async with ClientSession(recv, send) as sess:
            await sess.initialize()
            yield sess


async def call_tool(tool_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    async with open_session() as sess:
        return await sess.call_tool(tool_id, params)


async def list_tools() -> List[Dict[str, Any]]:
    async with open_session() as sess:
        return await sess.list_tools()
