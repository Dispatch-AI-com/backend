from typing import Dict, Any
from mcp.client.sse import sse_client
from mcp import ClientSession
from langchain_core.runnables import RunnableLambda, RunnableSequence

MCP_URL = "http://127.0.0.1:8000/mcp"

async def _call_mcp(tool_id: str, params: Dict[str, Any]):
    async with sse_client(MCP_URL) as (recv, send):
        async with ClientSession(recv, send) as sess:
            await sess.initialize()
            return await sess.call_tool(tool_id, params)
        
def _to_dict(res: Any) -> Dict[str, Any]:
    if hasattr(res, "model_dump"):
        return res.model_dump()
    if hasattr(res, "dict"):
        return res.dict()
    return dict(res)