from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from ..domain.entities import Call, ConversationMessage, CallSummary, ServiceInfo, SpeakerType
from ..domain.services import (
    ConversationFormatService,
    CallSummaryService,
    ConversationValidationService
)
from ..infrastructure.llm_adapter import LLMAdapter


class AIService:
    """Application service for AI operations."""

    def __init__(self, llm_adapter: LLMAdapter):
        self.llm_adapter = llm_adapter

    async def generate_chat_response(self, call_sid: str, user_message: str) -> str:
        """Generate a chat response for a user message."""
        if not ConversationValidationService.validate_message_content(user_message):
            raise ValueError("Message content is invalid")
        
        try:
            response = await self.llm_adapter.generate_chat_response(user_message)
            return response
        except Exception as e:
            raise AIServiceError(f"Failed to generate chat response: {str(e)}")

    async def generate_call_summary(
        self,
        call_sid: str,
        conversation_data: List[Dict[str, Any]],
        service_info: Optional[Dict[str, Any]] = None
    ) -> CallSummary:
        """Generate a summary for a call conversation."""
        
        # Validate input data
        if not ConversationValidationService.validate_call_data(call_sid, conversation_data):
            raise ValueError("Invalid call data provided")
        
        try:
            # Convert input data to domain objects
            call = self._create_call_from_data(call_sid, conversation_data, service_info)
            
            # Generate summary using AI
            summary_prompt = ConversationFormatService.create_summary_prompt(call)
            ai_response = await self.llm_adapter.generate_response(summary_prompt)
            
            # Create summary from AI response
            summary = CallSummaryService.create_from_ai_response(call, ai_response)
            
            return summary
            
        except Exception:
            # Create fallback summary if AI fails
            call = self._create_call_from_data(call_sid, conversation_data, service_info)
            fallback_summary = CallSummaryService.create_fallback_summary(call)
            return fallback_summary

    def _create_call_from_data(
        self,
        call_sid: str,
        conversation_data: List[Dict[str, Any]],
        service_info: Optional[Dict[str, Any]] = None
    ) -> Call:
        """Create a Call domain object from input data."""
        
        # Convert conversation data to domain objects
        conversation = []
        for msg_data in conversation_data:
            speaker = SpeakerType.AI if msg_data["speaker"].upper() == "AI" else SpeakerType.CUSTOMER
            timestamp = datetime.fromisoformat(msg_data["timestamp"]) if "timestamp" in msg_data else datetime.now(timezone.utc)
            
            message = ConversationMessage(
                speaker=speaker,
                message=msg_data["message"],
                timestamp=timestamp
            )
            conversation.append(message)
        
        # Convert service info if provided
        service_obj = None
        if service_info:
            service_obj = ServiceInfo(
                name=service_info.get("name", "Unknown service"),
                booked=service_info.get("booked", False),
                additional_info=service_info.get("additional_info")
            )
        
        return Call(
            call_sid=call_sid,
            conversation=conversation,
            service_info=service_obj
        )


class AIServiceError(Exception):
    """Exception raised by AI service operations."""
    pass