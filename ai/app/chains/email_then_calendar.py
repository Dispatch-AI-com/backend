# app/chains/email_then_calendar.py
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

# 1. 发邮件：返回 “原 payload + email_result”
async def send_email_step(p: Dict[str, Any]) -> Dict[str, Any]:
    email_res = await _call_mcp("send_email", {
        "to": p["to"],
        "subject": p["subject"],
        "body": p["body"],
    })
    return {**p, "email_result": _to_dict(email_res)}

# 2. 推日历：同样返回 “原 payload + calendar_result”
async def calendar_push_step(p: Dict[str, Any]) -> Dict[str, Any]:
    cal_res = await _call_mcp("calendar_push", {
        "title": p["title"],
        "start": p["start"],
        "end":   p["end"],
        "description": p.get("description", ""),
        "location":    p.get("location", ""),
        "organizer":   p.get("organizer", ""),
        "access_token": p.get("access_token", ""),
    })
    return {**p, "calendar_result": _to_dict(cal_res)}

chain = RunnableSequence(
    RunnableLambda(send_email_step),
    RunnableLambda(calendar_push_step),
)

async def run_email_then_calendar(payload: Dict[str, Any]) -> Dict[str, Any]:
    return await chain.ainvoke(payload)
