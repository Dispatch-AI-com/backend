#!/usr/bin/env python3
"""
Test script for LLM-first speech correction functionality
"""

import sys
import os
import asyncio
import time

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.llm_speech_corrector import LLMSpeechCorrector


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
    asyncio.run(test_llm_speech_corrector())