from typing import Dict, Any, List
from services.llm import llm_service


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


class SummaryService:
    def __init__(self):
        pass

    async def generate_summary(
        self, call_sid: str, conversation_data: List[Dict], service_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate AI-powered call summary from conversation data."""
        # Format conversation for AI processing
        conversation_text = "\n".join(
            [f"{msg['speaker']}: {msg['message']}" for msg in conversation_data]
        )

        # Add call_sid to service_info for context
        enhanced_service_info = service_info.copy() if service_info else {}
        enhanced_service_info["call_id"] = call_sid

        # Create summary prompt using the structured format
        prompt = create_summary_prompt(conversation_text, enhanced_service_info)

        # Use LLM service to generate summary
        summary_response = await llm_service.chat(prompt)
        
        # Try to parse JSON response, fallback to structured format
        try:
            import json
            result = json.loads(summary_response)
            # Convert keyPoints to key_points for consistency with existing code
            if "keyPoints" in result and "key_points" not in result:
                result["key_points"] = result["keyPoints"]
            return result
        except json.JSONDecodeError:
            # Fallback to basic structure if JSON parsing fails
            return {
                "summary": summary_response,
                "key_points": ["Key point extracted from AI response"],
            }


summary_service = SummaryService()
