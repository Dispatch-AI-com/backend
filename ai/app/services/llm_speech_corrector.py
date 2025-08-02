from typing import Optional, Dict
import asyncio
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()


class SimplifiedSpeechCorrector:
    def __init__(self, api_key: Optional[str] = None):
        self.critical_corrections = {
            "NSEW": "NSW",
            "N S E W": "NSW", 
            "new south wales east west": "NSW",
            "Victor": "VIC",
            "Victoria": "VIC",
            "Queens Land": "QLD",
            "Queensland": "QLD",
            "South Australia": "SA",
            "Western Australia": "WA", 
            "Tasmania": "TAS",
            "Northern Territory": "NT",
            "Australian Capital Territory": "ACT",
            "rode": "Road",
            "rd": "Road",
            "street": "Street",
            "st": "Street",
            "Para Mata": "Parramatta",
            "Paramatta": "Parramatta"
        }
        
        if settings.llm_provider == "openai" and (api_key or settings.openai_api_key):
            self.client = AsyncOpenAI(api_key=api_key or settings.openai_api_key)
        else:
            self.client = None

    def _apply_critical_corrections(self, text: str) -> tuple[str, bool]:
        corrected_text = text
        was_corrected = False
        
        for incorrect, correct in self.critical_corrections.items():
            # Check for exact word boundaries to avoid partial replacements
            import re
            pattern = r'\b' + re.escape(incorrect) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                corrected_text = re.sub(pattern, correct, corrected_text, flags=re.IGNORECASE)
                was_corrected = True
        
        return corrected_text, was_corrected

    async def _llm_correct_speech(self, text: str, context: str) -> Optional[str]:
        if not self.client or settings.llm_provider != "openai":
            return None
            
        try:
            prompt = f"""You are correcting speech recognition errors in Australian address collection.

Context: {context}
Original text: "{text}"

Common speech recognition errors to fix:
- "NSEW" should be "NSW" (New South Wales)
- State name mishearing (Victor->VIC, Queens Land->QLD)
- Address words (rode->Road, st->Street)

Return ONLY the corrected text, no explanation. If no correction needed, return the original text exactly."""

            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=100,
                    temperature=0.0
                ),
                timeout=5.0
            )
            
            corrected = response.choices[0].message.content
            return corrected.strip() if corrected else None
            
        except Exception:
            return None

    async def correct_speech_input(self, text: str, context: str = "address_collection") -> Dict[str, str]:
        if not text or not text.strip():
            return {
                "original": text,
                "corrected": text,
                "method": "no_change"
            }
        
        # Step 1: Apply critical corrections
        corrected_text, was_critically_corrected = self._apply_critical_corrections(text)
        
        if was_critically_corrected:
            return {
                "original": text,
                "corrected": corrected_text,
                "method": "critical_correction"
            }
        
        # Step 2: Try LLM correction if critical corrections didn't apply
        if self.client and settings.llm_provider == "openai":
            llm_result = await self._llm_correct_speech(text, context)
            if llm_result and llm_result.strip() != text.strip():
                return {
                    "original": text,
                    "corrected": llm_result,
                    "method": "llm_correction"
                }
        
        # Step 3: Return original if no corrections needed
        return {
            "original": text,
            "corrected": text,
            "method": "no_change"
        }