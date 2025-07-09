from typing import List, Tuple, Dict, Any
from datetime import datetime
import json
import re

from .entities import Call, CallSummary
from .value_objects import AIPrompt


class ConversationFormatService:
    """Domain service for formatting conversations."""

    @staticmethod
    def format_for_ai_processing(call: Call) -> str:
        """Format a call's conversation for AI processing."""
        return call.generate_conversation_text()

    @staticmethod
    def create_summary_prompt(call: Call) -> AIPrompt:
        """Create an AI prompt for call summarization."""
        conversation_text = ConversationFormatService.format_for_ai_processing(call)
        
        service_context = ""
        if call.service_info:
            service_context = f"\nService discussed: {call.service_info.name}\n"
            service_context += f"Service was {'booked' if call.service_info.booked else 'not booked'}"

        prompt_template = f"""
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
        return AIPrompt(value=prompt_template.strip())


class SummaryParsingService:
    """Domain service for parsing AI summary responses."""

    @staticmethod
    def parse_ai_response(ai_response: str) -> Tuple[str, List[str]]:
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
        return SummaryParsingService._fallback_parse(ai_response)

    @staticmethod
    def _fallback_parse(ai_response: str) -> Tuple[str, List[str]]:
        """Fallback parsing method when JSON extraction fails."""
        lines = ai_response.split("\n")
        summary = "Call completed successfully"
        key_points = ["Customer inquiry handled"]

        for line in lines:
            if "summary" in line.lower():
                summary = line.split(":", 1)[-1].strip().strip('"')
            elif line.strip().startswith("-") or line.strip().startswith("•"):
                key_points.append(line.strip().lstrip("-•").strip())

        return summary, key_points[:5]  # Limit to 5 key points


class CallSummaryService:
    """Domain service for creating call summaries."""

    @staticmethod
    def create_from_ai_response(call: Call, ai_response: str) -> CallSummary:
        """Create a CallSummary from AI response."""
        summary_text, key_points = SummaryParsingService.parse_ai_response(ai_response)
        
        return CallSummary(
            call_sid=call.call_sid,
            summary=summary_text,
            key_points=key_points,
            created_at=datetime.utcnow(),
            service_info=call.service_info
        )

    @staticmethod
    def create_fallback_summary(call: Call) -> CallSummary:
        """Create a fallback summary when AI processing fails."""
        service_name = call.service_info.name if call.service_info else "service"
        conversation_count = call.message_count

        summary = f"Customer service call completed with {conversation_count} exchanges regarding {service_name}."
        
        key_points = [
            f"Customer contacted for {service_name} inquiry",
            f"Conversation included {conversation_count} exchanges",
        ]

        if call.service_info and call.service_info.booked:
            key_points.append("Service booking was completed")
            summary += " Service was successfully booked."
        else:
            key_points.append("Service inquiry discussed")

        return CallSummary(
            call_sid=call.call_sid,
            summary=summary,
            key_points=key_points,
            created_at=datetime.utcnow(),
            service_info=call.service_info
        )


class ConversationValidationService:
    """Domain service for validating conversation data."""

    @staticmethod
    def validate_message_content(message: str) -> bool:
        """Validate message content."""
        return bool(message and message.strip())

    @staticmethod
    def validate_call_data(call_sid: str, conversation: List[Dict[str, Any]]) -> bool:
        """Validate call data structure."""
        if not call_sid or not call_sid.strip():
            return False
        
        if not conversation or not isinstance(conversation, list):
            return False
        
        for msg in conversation:
            if not isinstance(msg, dict):
                return False
            if "speaker" not in msg or "message" not in msg:
                return False
            if not ConversationValidationService.validate_message_content(msg["message"]):
                return False
        
        return True