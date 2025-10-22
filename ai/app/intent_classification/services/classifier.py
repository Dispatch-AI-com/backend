"""
Intent Classification Service

Provides intent classification functionality for student service conversations.
Uses OpenAI GPT models to classify user intents based on conversation context.
"""

from openai import AsyncOpenAI
from typing import Optional, List, Dict, Any
import json
from config import get_settings
from services.redis_service import get_message_history
from .prompts import get_intent_classification_system_prompt

settings = get_settings()


class IntentClassifier:
    """Intent classification service

    Classifies user intent in international student service conversations into:
    - SCAM: Scam or malicious calls (fraud attempts)
    - OPPORTUNITY: Legitimate job/research/academic opportunities for students
    - OTHER: Complex issues, messages, or unclear intents requiring human handling
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize intent classifier

        Args:
            api_key: Optional OpenAI API key (defaults to settings)
        """
        self.api_key = api_key
        self._client = None
        self.model = settings.openai_model

    @property
    def client(self):
        """Lazy initialization of OpenAI client"""
        if self._client is None:
            self._client = AsyncOpenAI(api_key=self.api_key or settings.openai_api_key)
        return self._client

    async def classify_intent(
        self,
        current_message: str,
        message_history: Optional[List[Dict]] = None,
        call_sid: Optional[str] = None
    ) -> Dict[str, Any]:
        """Classify user intent from conversation

        Args:
            current_message: Current user message to classify
            message_history: Optional conversation history
            call_sid: Optional CallSid to fetch history from Redis

        Returns:
            Dict containing:
                - intent: Classification result (scam/opportunity/other)
                - confidence: Confidence score (0.0-1.0)
                - reasoning: Explanation of classification
                - metadata: Additional info (matched keywords, characteristics)
        """
        # Get message history from Redis if call_sid provided
        if call_sid and not message_history:
            message_history = get_message_history(call_sid)

        # Build conversation context
        conversation_context = self._build_conversation_context(
            current_message,
            message_history
        )

        # Get system prompt
        system_prompt = get_intent_classification_system_prompt()

        # Call OpenAI API
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": conversation_context}
                ],
                temperature=0.3,  # Lower temperature for consistent classification
                max_tokens=500,
                response_format={"type": "json_object"}  # Ensure JSON output
            )

            # Parse response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            # Validate and return result
            return self._validate_result(result)

        except Exception as e:
            print(f"❌ [INTENT_CLASSIFIER] Error during classification: {str(e)}")
            # Return safe fallback
            return {
                "intent": "other",  # Default to other for safety (human review)
                "confidence": 0.0,
                "reasoning": f"Classification failed due to error: {str(e)}",
                "metadata": {
                    "error": str(e),
                    "matched_keywords": [],
                    "matched_characteristics": []
                }
            }

    def _build_conversation_context(
        self,
        current_message: str,
        message_history: Optional[List[Dict]] = None
    ) -> str:
        """Build conversation context for classification

        Args:
            current_message: Current user message
            message_history: Optional conversation history

        Returns:
            Formatted conversation context string
        """
        context = "CONVERSATION CONTEXT:\n\n"

        # Add message history if available
        if message_history:
            context += "Previous Messages:\n"
            for msg in message_history[-5:]:  # Last 5 messages for context
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                speaker = "AI" if role == "assistant" else "Student"
                context += f"{speaker}: {content}\n"
            context += "\n"

        # Add current message
        context += f"Current Student Message: {current_message}\n\n"
        context += "Please classify the student's intent based on the conversation above."

        return context

    def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize classification result

        Args:
            result: Raw classification result

        Returns:
            Validated and sanitized result
        """
        # Ensure all required fields exist
        validated = {
            "intent": result.get("intent", "other"),
            "confidence": float(result.get("confidence", 0.0)),
            "reasoning": result.get("reasoning", "No reasoning provided"),
            "metadata": result.get("metadata", {})
        }

        # Validate intent value
        valid_intents = ["scam", "opportunity", "other"]
        if validated["intent"] not in valid_intents:
            print(f"⚠️ [INTENT_CLASSIFIER] Invalid intent '{validated['intent']}', defaulting to 'other'")
            validated["intent"] = "other"
            validated["confidence"] = 0.0

        # Validate confidence range
        validated["confidence"] = max(0.0, min(1.0, validated["confidence"]))

        # Ensure metadata has required fields
        if "matched_keywords" not in validated["metadata"]:
            validated["metadata"]["matched_keywords"] = []
        if "matched_characteristics" not in validated["metadata"]:
            validated["metadata"]["matched_characteristics"] = []

        return validated


# Global classifier instance
intent_classifier = IntentClassifier()
