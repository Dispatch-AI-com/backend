from fastapi import APIRouter, Request
from ..services.llm import chain

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    responses={404: {"description": "Not found"}},
)


@router.post("/chat")
async def chat(request: Request):
    body = await request.json()
    user_input = body.get("message")

    if not user_input:
        return {"error": "Missing 'message' in request body"}

    response = await chain.ainvoke({"user_input": user_input})
    return {"response": response}
