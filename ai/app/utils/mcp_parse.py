# app/utils/mcp_parse.py
import json
from typing import Any

def to_dict(res: Any) -> dict:
    if hasattr(res, "model_dump"):
        return res.model_dump()
    if hasattr(res, "dict"):
        return res.dict()
    return dict(res)

def parse_tool_result(res: Any):
    data = to_dict(res)

    if data.get("structuredContent") is not None:
        return data["structuredContent"]

    for item in data.get("content", []) or []:
        if item.get("type") == "text" and item.get("text"):
            txt = item["text"]
            try:
                return json.loads(txt)
            except Exception:
                return txt
    return data