from fastapi import APIRouter, Request
from ..services.llm import chain

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    responses={404: {"description": "Not found"}},
)

@router.post("/")
async def ai_chat(request: Request):
    msg = (await request.body()).decode()
    reply = await chain.arun(user_input=msg)
    return {"text": reply}

