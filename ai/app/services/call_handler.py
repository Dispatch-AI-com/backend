from uuid import uuid4
from datetime import datetime
from typing import Dict, Any
from models.call import CallRequest, CallSummary, CallStatus
from services.llm import llm_service


class CallHandler:
    def __init__(self):
        self.active_calls: Dict[str, Dict[str, Any]] = {}

    async def initiate_call(self, request: CallRequest) -> str:
        call_id = str(uuid4())
        self.active_calls[call_id] = {
            "phone_number": request.phone_number,
            "customer_name": request.customer_name,
            "purpose": request.purpose,
            "status": CallStatus.PENDING,
            "start_time": datetime.now(),
            "conversation": [],
        }
        return call_id

    async def process_call_message(self, call_id: str, message: str) -> str:
        if call_id not in self.active_calls:
            raise ValueError("Call not found")

        call_data = self.active_calls[call_id]
        call_data["conversation"].append({"user": message, "timestamp": datetime.now()})
        call_data["status"] = CallStatus.IN_PROGRESS

        # Use LLM to process message
        context = f"Customer call for {call_data.get('purpose', 'general inquiry')}"
        response = await llm_service.chat(message, context)

        call_data["conversation"].append({"ai": response, "timestamp": datetime.now()})
        return response

    async def end_call(self, call_id: str) -> CallSummary:
        if call_id not in self.active_calls:
            raise ValueError("Call not found")

        call_data = self.active_calls[call_id]
        call_data["status"] = CallStatus.COMPLETED

        # Generate conversation summary
        conversation_text = "\n".join(
            [
                f"User: {msg['user']}" if "user" in msg else f"AI: {msg['ai']}"
                for msg in call_data["conversation"]
            ]
        )

        summary_result = await llm_service.summarize_conversation(conversation_text)

        duration = (datetime.now() - call_data["start_time"]).seconds

        return CallSummary(
            call_id=call_id,
            status=CallStatus.COMPLETED,
            summary=summary_result["summary"],
            key_points=summary_result["key_points"],
            duration=duration,
        )


call_handler = CallHandler()
