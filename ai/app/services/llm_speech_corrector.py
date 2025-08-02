"""
Simplified Speech Correction Service

Streamlined LLM-based speech correction for phone call scenarios,
focusing on accuracy and simplicity over caching complexity.
"""

import json
import asyncio
from typing import Dict, Tuple
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
            "Para-mata": "Parramatta"
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
            "reasoning": f"Applied: {', '.join(corrections_applied)}" if corrections_applied else "No critical corrections needed"
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
                "method": "mock_llm"
            }
        
        if self.client is None:
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": "LLM client not available",
                "method": "no_client"
            }
        
        # Optimized prompt for speech recognition errors
        correction_prompt = f"""You are an expert at fixing speech recognition errors from phone calls, especially Australian addresses with diverse accents.

TASK: Fix speech recognition errors in this text: "{text}"
CONTEXT: {context}

COMMON PATTERNS TO FIX:
- Australian states: NSW, VIC, QLD, SA, WA, TAS, NT, ACT
- Street types: Road, Street, Avenue, Drive, Lane, Court, Place, Crescent  
- Numbers that sound like letters: "eight" → "8", "oh" → "0"
- Accent variations: Different pronunciations of place names
- Phonetic errors: Words that sound similar but are different

RULES:
1. ONLY fix clear speech recognition errors
2. Keep text natural and conversational
3. Don't change correct information
4. Focus on Australian address/location terms

Return ONLY this JSON (no other text):
{{"original": "{text}", "corrected": "fixed_text", "confidence": 0.0-1.0, "reasoning": "brief_explanation"}}"""

        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": "You are a speech recognition error correction specialist for Australian phone calls."},
                        {"role": "user", "content": correction_prompt}
                    ],
                    max_tokens=150,
                    temperature=0.1
                ),
                timeout=self.timeout_seconds
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
            
            result = json.loads(content)
            result["method"] = "llm_correction"
            return result
            
        except asyncio.TimeoutError:
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": "LLM timeout - keeping original",
                "method": "timeout"
            }
        except Exception as e:
            print(f"LLM correction error: {str(e)}")
            return {
                "original": text,
                "corrected": text,
                "confidence": 0.0,
                "reasoning": f"LLM error: {str(e)[:50]}",
                "method": "error"
            }
    
    async def correct_speech_input(self, text: str, context: str = "address_collection") -> Dict:
        """
        Main speech correction method with caching and fallbacks
        
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
                "cached": False
            }
        
        # Check cache first
        cached_result = self.cache.get(text, context)
        if cached_result:
            cached_result["cached"] = True
            return cached_result
        
        # Try LLM correction with retries
        for attempt in range(self.max_retries + 1):
            try:
                result = await self._llm_correct_with_timeout(text, context)
                
                # Validate result
                if (result.get("confidence", 0) > 0.3 and 
                    result.get("corrected") and 
                    result["method"] == "llm_correction"):
                    
                    result["cached"] = False
                    result["attempts"] = attempt + 1
                    
                    # Cache successful result
                    self.cache.set(text, context, result)
                    return result
                    
            except Exception as e:
                print(f"LLM correction attempt {attempt + 1} failed: {e}")
                continue
        
        # Fallback to critical corrections
        fallback_corrected, fallback_changed = self._apply_critical_fallback(text)
        
        result = {
            "original": text,
            "corrected": fallback_corrected,
            "confidence": 0.8 if fallback_changed else 0.1,
            "reasoning": "Critical fallback applied" if fallback_changed else "No correction needed",
            "method": "critical_fallback" if fallback_changed else "no_correction",
            "cached": False,
            "attempts": self.max_retries + 1
        }
        
        # Cache fallback result
        self.cache.set(text, context, result)
        return result
    
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
    
    def get_performance_stats(self) -> Dict:
        """Get performance and cache statistics"""
        return {
            "cache_stats": self.cache.get_stats(),
            "timeout_seconds": self.timeout_seconds,
            "max_retries": self.max_retries
        }


# Test function for the new LLM-first corrector
async def test_llm_speech_corrector():
    """Test the LLM-first speech correction system"""
    corrector = LLMSpeechCorrector(api_key="test-key")  # Will use mock mode
    
    test_cases = [
        "I live in NSEW",
        "My address is one two three Victor Street", 
        "I'm from Queens Land Australia",
        "The house number is ate seven two Main rode",
        "I'm calling from Para Mata",
        "My postcode is three oh oh eight",
        "It's on Norse Sidney road",
        "The suburb is Cash mere"
    ]
    
    print("LLM-First Speech Correction Test:")
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
        print(f"Cached:     {result.get('cached', False)}")
        print(f"Time:       {(end_time - start_time)*1000:.1f}ms")
        print(f"Reasoning:  {result['reasoning']}")
        print("-" * 40)
    
    # Test caching
    print("\nTesting cache performance:")
    start_time = time.time()
    cached_result = await corrector.correct_speech_input("I live in NSEW")
    end_time = time.time()
    print(f"Second call (cached): {(end_time - start_time)*1000:.1f}ms")
    print(f"Cache stats: {corrector.get_performance_stats()}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_llm_speech_corrector())