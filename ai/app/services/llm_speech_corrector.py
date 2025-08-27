"""
Simplified Speech Correction Service

Streamlined LLM-based speech correction for phone call scenarios,
focusing on accuracy and simplicity over caching complexity.
"""

import json
import asyncio
import re
import logging
from typing import Dict
from config import get_settings

settings = get_settings()

# Set up logging for speech correction
logger = logging.getLogger(__name__)


class SimplifiedSpeechCorrector:
    """Simplified speech correction system for phone call scenarios"""

    def __init__(self, api_key=None):
        # MVP: Disable LLM client - only use dictionary corrections
        self.client = None

        # Performance settings (kept for future use)
        self.timeout_seconds = 3.0
        self.max_retries = 2

        # Critical corrections for immediate fallback
        self.critical_corrections = {
            # Australian state names (most critical)
            "NSEW": "NSW",
            "N.S.E.W": "NSW",
            "N S E W": "NSW",
            "North South East West": "NSW",
            "new south wales east west": "NSW",
            "new south": "NSW",
            "Victor": "VIC",
            "Victoria": "VIC",
            "Queens Land": "QLD",
            "Queen's Land": "QLD",
            "Queensland": "QLD",
            "South Australia": "SA",
            "West Australia": "WA",
            "Western Australia": "WA",
            "Tasmania": "TAS",
            "Tassie": "TAS",
            "Northern Territory": "NT",
            "Australian Capital Territory": "ACT",
            # Common street types
            "rode": "Road",
            "rd": "Road",
            "strait": "Street",
            "street": "Street",
            "st": "Street",
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
            "Paramatta": "Parramatta",
        }

    def _apply_critical_corrections(self, text: str) -> Dict:
        """Apply critical corrections using dictionary mapping with word boundaries"""
        logger.info(
            f"[SPEECH_CORRECTION] Starting critical corrections for text: '{text}'"
        )

        corrected = text
        changed = False
        corrections_applied = []

        for wrong, correct in self.critical_corrections.items():
            # Check for exact word boundaries to avoid partial replacements
            pattern = r"\b" + re.escape(wrong) + r"\b"
            if re.search(pattern, text, re.IGNORECASE):
                corrected = re.sub(pattern, correct, corrected, flags=re.IGNORECASE)
                changed = True
                corrections_applied.append(f"{wrong} → {correct}")
                logger.info(
                    f"[SPEECH_CORRECTION] Applied correction: '{wrong}' → '{correct}'"
                )

        result = {
            "original": text,
            "corrected": corrected,
            "confidence": 0.9 if changed else 0.1,
            "method": "critical_corrections" if changed else "no_correction",
            "reasoning": f"Applied: {', '.join(corrections_applied)}"
            if corrections_applied
            else "No critical corrections needed",
        }

        if changed:
            logger.info(
                f"[SPEECH_CORRECTION] Applied corrections: {', '.join(corrections_applied)}"
            )
            logger.info(f"[SPEECH_CORRECTION] '{text}' → '{corrected}'")

        return result

    def _should_use_llm(self, text: str) -> bool:
        """MVP: Disable LLM usage - only use dictionary corrections"""
        return False

    async def _llm_correct_with_timeout(self, text: str, context: str) -> Dict:
        """LLM correction with enhanced error handling for production"""
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

        # Simplified, more reliable prompt for production
        correction_prompt = f"""Fix speech errors in Australian address: "{text}"

Common fixes:
- NSEW → NSW
- Victor → VIC  
- Queens Land → QLD
- rode → Road
- grandstand → Grandstand

Return ONLY: {{"original": "{text}", "corrected": "fixed_text", "confidence": 0.8, "reasoning": "explanation"}}"""

        # Try with retries for better reliability
        for attempt in range(self.max_retries):
            try:
                response = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=settings.openai_model,
                        messages=[
                            {
                                "role": "system",
                                "content": "Fix Australian address speech errors. Return only JSON.",
                            },
                            {"role": "user", "content": correction_prompt},
                        ],
                        max_tokens=100,
                        temperature=0.0,  # More deterministic
                    ),
                    timeout=self.timeout_seconds,
                )

                if not response.choices or not response.choices[0].message.content:
                    continue  # Retry if empty response

                content = response.choices[0].message.content.strip()

                # Robust JSON extraction
                try:
                    # Clean common JSON formatting issues
                    if content.startswith("```"):
                        lines = content.split("\n")
                        for line in lines:
                            if line.strip().startswith("{"):
                                content = line.strip()
                                break

                    # Remove trailing text after JSON
                    if "}" in content:
                        content = content[: content.rfind("}") + 1]

                    result = json.loads(content)

                    # Validate required fields
                    if not all(
                        key in result
                        for key in ["original", "corrected", "confidence", "reasoning"]
                    ):
                        continue  # Retry if missing fields

                    # Ensure safe values
                    result["method"] = "llm_correction"
                    result["confidence"] = min(
                        max(float(result.get("confidence", 0.5)), 0.0), 1.0
                    )
                    result["reasoning"] = str(
                        result.get("reasoning", "LLM correction applied")
                    )[:100]  # Limit length

                    return result

                except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
                    print(
                        f"Speech corrector JSON parse error (attempt {attempt + 1}): {parse_error}"
                    )
                    continue  # Retry on parse error

            except asyncio.TimeoutError:
                print(f"Speech corrector timeout (attempt {attempt + 1})")
                continue
            except Exception as api_error:
                print(
                    f"Speech corrector API error (attempt {attempt + 1}): {str(api_error)[:50]}"
                )
                continue

        # All retries failed - return safe fallback
        print(f"Speech corrector: All {self.max_retries} attempts failed for '{text}'")
        return {
            "original": text,
            "corrected": text,
            "confidence": 0.0,
            "reasoning": "LLM service temporarily unavailable",
            "method": "llm_error",
        }

    async def correct_speech_input(
        self, text: str, context: str = "address_collection"
    ) -> Dict:
        """
        MVP Speech correction - only fix obvious issues, keep it simple

        For MVP: Focus on critical Australian address corrections only.
        No complex LLM calls, just dictionary-based fixes.

        Args:
            text: Speech recognition text to correct
            context: Context (not used in MVP version)

        Returns:
            Dict: Correction result with metadata
        """
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "original": text or "",
                "corrected": text or "",
                "confidence": 1.0,
                "reasoning": "Empty input",
                "method": "no_correction",
            }

        try:
            # MVP: Only apply critical corrections (fast, reliable)
            return self._apply_critical_corrections(text)

        except Exception as e:
            # MVP: Simple fallback, no complex error handling
            logger.error(f"[SPEECH_CORRECTION] Error during correction: {e}")
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": "Using original text",
                "method": "error_fallback",
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
