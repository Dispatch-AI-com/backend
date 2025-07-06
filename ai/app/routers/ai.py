# app/routers/ai.py
from typing import List, Tuple
import json
import re
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from ..services.llm import chain  # make sure this exists and is async

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
    responses={404: {"description": "Not found"}},
)


class MessageIn(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    message: str = Field(..., description="Customer utterance")


class MessageOut(BaseModel):
    replyText: str = Field(..., description="Assistant response")


class ConversationMessage(BaseModel):
    speaker: str = Field(..., description="Speaker type: AI or customer")
    message: str = Field(..., description="Message content")
    timestamp: str = Field(..., description="Message timestamp")


class SummaryIn(BaseModel):
    callSid: str = Field(..., description="Twilio CallSid – unique call ID")
    conversation: List[ConversationMessage] = Field(
        ..., description="Full conversation history"
    )
    serviceInfo: dict = Field(default={}, description="Service booking information")


class SummaryOut(BaseModel):
    summary: str = Field(..., description="Call summary")
    keyPoints: List[str] = Field(..., description="Key points from the conversation")


@router.post(
    "/chat",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Generate assistant response via LLM",
)
async def chat_endpoint(body: MessageIn) -> MessageOut:
    if not body.message.strip():
        raise HTTPException(422, detail="`message` must not be empty")

    reply = await chain.ainvoke({"user_input": body.message})
    print(f"callSid: {body.callSid}, reply: {reply}")
    return MessageOut(replyText=reply)


@router.post(
    "/reply",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Echo reply (placeholder)",
)
async def reply_endpoint(body: MessageIn) -> MessageOut:
    replyText = body.message + ",Please say next i will repeat it"

    return MessageOut(replyText=replyText)


@router.post(
    "/summary",
    response_model=SummaryOut,
    status_code=status.HTTP_200_OK,
    summary="Generate AI-powered call summary from conversation data",
)
async def summary_endpoint(body: SummaryIn) -> SummaryOut:
    try:
        # Convert conversation to text format for AI analysis
        conversation_text = format_conversation_for_ai(body.conversation)

        # Create prompt for AI summarization
        summary_prompt = create_summary_prompt(conversation_text, body.serviceInfo)

        # Generate AI summary using the LLM chain
        ai_response = await chain.ainvoke({"user_input": summary_prompt})

        # Parse AI response to extract summary and key points
        summary, keyPoints = parse_ai_summary_response(ai_response)

        return SummaryOut(summary=summary, keyPoints=keyPoints)

    except Exception as e:
        print(f"Error generating AI summary for {body.callSid}: {str(e)}")
        # Fallback to basic summary if AI fails
        return generate_fallback_summary(body)


# Helper functions for AI summary generation


def format_conversation_for_ai(conversation: List[ConversationMessage]) -> str:
    """Convert conversation messages to text format for AI analysis."""
    formatted_lines = []
    for msg in conversation:
        speaker_label = "Assistant" if msg.speaker.upper() == "AI" else "Customer"
        formatted_lines.append(f"{speaker_label}: {msg.message}")
    return "\n".join(formatted_lines)


def create_summary_prompt(conversation_text: str, service_info: dict) -> str:
    """Create AI prompt for conversation summarization."""
    service_context = ""
    if service_info:
        service_name = service_info.get("name", "Unknown service")
        service_booked = service_info.get("booked", False)
        service_context = f"\nService discussed: {service_name}\nService was {'booked' if service_booked else 'not booked'}"

    return f"""
Please analyze this customer service call conversation and provide a summary with key points.

CONVERSATION:
{conversation_text}
{service_context}

Please respond in the following JSON format:
{{
    "summary": "A concise 2-3 sentence summary of the call",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}}

Focus on:
- What the customer needed
- What services were discussed
- Whether any booking was made
- The outcome of the call
- Any follow-up actions needed
"""


def parse_ai_summary_response(ai_response: str) -> Tuple[str, List[str]]:
    """Parse AI response to extract summary and key points."""
    try:
        # Try to extract JSON from the AI response
        json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            parsed = json.loads(json_str)
            summary = parsed.get("summary", "Call completed successfully")
            key_points = parsed.get("keyPoints", ["Customer inquiry handled"])
            return summary, key_points
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback parsing if JSON extraction fails
    lines = ai_response.split("\n")
    summary = "Call completed successfully"
    key_points = ["Customer inquiry handled"]

    for line in lines:
        if "summary" in line.lower():
            summary = line.split(":", 1)[-1].strip().strip('"')
        elif line.strip().startswith("-") or line.strip().startswith("•"):
            key_points.append(line.strip().lstrip("-•").strip())

    return summary, key_points[:5]  # Limit to 5 key points


def generate_fallback_summary(body: SummaryIn) -> SummaryOut:
    """Generate basic summary when AI fails."""
    conversation_count = len(body.conversation)
    service_name = (
        body.serviceInfo.get("name", "service") if body.serviceInfo else "service"
    )

    summary = f"Customer service call completed with {conversation_count} exchanges regarding {service_name}."

    key_points = [
        f"Customer contacted for {service_name} inquiry",
        f"Conversation included {conversation_count} exchanges",
    ]

    if body.serviceInfo and body.serviceInfo.get("booked"):
        key_points.append("Service booking was completed")
        summary += " Service was successfully booked."
    else:
        key_points.append("Service inquiry discussed")

    return SummaryOut(summary=summary, keyPoints=key_points)
