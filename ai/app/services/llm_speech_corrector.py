"""
Simplified Speech Correction Service

Streamlined LLM-based speech correction for phone call scenarios,
focusing on accuracy and simplicity over caching complexity.
"""

import json
import asyncio
from typing import Dict
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()


class SimplifiedSpeechCorrector:
    """Simplified speech correction system for phone call scenarios"""

    def __init__(self, api_key=None):
        self.client = None
        if settings.llm_provider == "openai":
            self.client = AsyncOpenAI(api_key=api_key or settings.openai_api_key)

        # Performance settings
        self.timeout_seconds = 3.0
        self.max_retries = 2

        # Critical corrections for immediate fallback
        self.critical_corrections = {
            # Australian state names (most critical)
            "NSEW": "NSW",
            "N.S.E.W": "NSW",
            "North South East West": "NSW",
            "new south": "NSW",
            "Victor": "VIC",
            "Victoria": "VIC",
            "Queens Land": "QLD",
            "Queensland": "QLD",
            "Queen's Land": "QLD",
            "South Australia": "SA",
            "West Australia": "WA",
            "Western Australia": "WA",
            "Tasmania": "TAS",
            "Tassie": "TAS",
            "Northern Territory": "NT",
            # Common street types
            "rode": "Road",
            "strait": "Street",
            "drove": "Drive",
            "lain": "Lane",
            "caught": "Court",
            "plays": "Place",
            "present": "Crescent",
            # Direction words
            "Norse": "North",
            "Yeast": "East",
            "Waste": "West",
            # Common place names
            "Para Mata": "Parramatta",
            "Para-mata": "Parramatta",
        }

    def _apply_critical_corrections(self, text: str) -> Dict:
        """Apply critical corrections using dictionary mapping"""
        corrected = text
        changed = False
        corrections_applied = []

        for wrong, correct in self.critical_corrections.items():
            if wrong.lower() in text.lower():
                # Case-insensitive replacement
                import re

                pattern = re.compile(re.escape(wrong), re.IGNORECASE)
                if pattern.search(corrected):
                    corrected = pattern.sub(correct, corrected)
                    changed = True
                    corrections_applied.append(f"{wrong} → {correct}")

        return {
            "original": text,
            "corrected": corrected,
            "confidence": 0.9 if changed else 0.1,
            "method": "critical_corrections" if changed else "no_correction",
            "reasoning": f"Applied: {', '.join(corrections_applied)}"
            if corrections_applied
            else "No critical corrections needed",
        }

    def _should_use_llm(self, text: str) -> bool:
        """Determine if LLM correction is needed based on text complexity"""
        # Use LLM for longer, more complex inputs that might have subtle errors
        if len(text.split()) > 3:  # More than 3 words
            return True

        # Use LLM if text contains numbers (often misrecognized)
        if any(char.isdigit() for char in text):
            return True

        # Skip LLM for very short, simple inputs
        return False

    async def _llm_correct_with_timeout(self, text: str, context: str) -> Dict:
        """LLM correction with timeout and error handling"""
        if settings.llm_provider == "mock":
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.5,
                "reasoning": "Mock LLM - no correction applied",
                "method": "mock_llm",
            }

        if self.client is None:
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": "LLM client not available",
                "method": "no_client",
            }

        # Streamlined prompt for phone call scenarios
        correction_prompt = f"""Fix speech recognition errors in: "{text}"

Focus on Australian addresses: states (NSW, VIC, QLD, SA, WA, TAS, NT, ACT), 
street types (Road, Street, Avenue, Drive, Lane, Court, Place, Crescent),
and common phonetic errors.

Return JSON: {{"original": "{text}", "corrected": "fixed_text", "confidence": 0.0-1.0, "reasoning": "explanation"}}"""

        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You fix Australian address speech recognition errors in phone calls.",
                        },
                        {"role": "user", "content": correction_prompt},
                    ],
                    max_tokens=120,
                    temperature=0.1,
                ),
                timeout=self.timeout_seconds,
            )

            content = response.choices[0].message.content.strip()

            # Clean JSON response
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            result["method"] = "llm_correction"
            return result

        except Exception as e:
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": f"LLM failed: {str(e)[:30]}",
                "method": "llm_error",
            }

    async def correct_speech_input(
        self, text: str, context: str = "address_collection"
    ) -> Dict:
        """
        Simplified speech correction method for phone call scenarios

        Args:
            text: Speech recognition text to correct
            context: Context of the collection (address_collection, etc.)

        Returns:
            Dict: Correction result with metadata
        """
        if not text or not text.strip():
            return {
                "original": text,
                "corrected": text,
                "confidence": 1.0,
                "reasoning": "Empty input",
                "method": "no_correction",
            }

        # Step 1: Apply critical corrections (fast, reliable)
        critical_result = self._apply_critical_corrections(text)
        if critical_result["confidence"] > 0.5:  # Found critical corrections
            return critical_result

        # Step 2: Use LLM for complex cases (if warranted)
        if self._should_use_llm(text):
            try:
                llm_result = await self._llm_correct_with_timeout(text, context)
                # Return LLM result if confidence is reasonable
                if llm_result.get("confidence", 0) > 0.4:
                    return llm_result
            except Exception as e:
                print(f"LLM correction failed: {e}")

        # Step 3: Return original with low confidence
        return {
            "original": text,
            "corrected": text,
            "confidence": 0.1,
            "reasoning": "No corrections applied",
            "method": "no_correction",
        }

    def should_apply_correction(self, result: Dict, threshold: float = 0.6) -> bool:
        """Determine if correction should be applied based on confidence"""
        confidence = result.get("confidence", 0.0)
        original = result.get("original", "")
        corrected = result.get("corrected", "")

        # Don't apply if no change
        if original == corrected:
            return False

        # Apply if confidence is above threshold
        return confidence >= threshold


# Test function for the simplified corrector
async def test_simplified_speech_corrector():
    """Test the simplified speech correction system"""
    corrector = SimplifiedSpeechCorrector(api_key="test-key")  # Will use mock mode

    test_cases = [
        "I live in NSEW",
        "My address is one two three Victor Street",
        "I'm from Queens Land Australia",
        "The house number is ate seven two Main rode",
        "I'm calling from Para Mata",
        "My postcode is three oh oh eight",
        "It's on Norse Sidney road",
        "The suburb is Cash mere",
    ]

    print("Simplified Speech Correction Test:")
    print("=" * 60)

    for test_input in test_cases:
        start_time = time.time()
        result = await corrector.correct_speech_input(test_input)
        end_time = time.time()

        should_apply = corrector.should_apply_correction(result)

        print(f"Input:      {test_input}")
        print(f"Corrected:  {result['corrected']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Method:     {result['method']}")
        print(f"Apply:      {'Yes' if should_apply else 'No'}")
        print(f"Time:       {(end_time - start_time) * 1000:.1f}ms")
        print(f"Reasoning:  {result['reasoning']}")
        print("-" * 40)


if __name__ == "__main__":
    import asyncio
    import time

    asyncio.run(test_simplified_speech_corrector())
