#!/usr/bin/env python3
"""
Simple test for speech correction functionality
"""
import asyncio
import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.llm_speech_corrector import SimplifiedSpeechCorrector


async def test_speech_correction():
    """Test the speech correction functionality"""
    print("🧪 Testing Speech Correction Functionality")
    print("=" * 50)
    
    # Initialize corrector with mock API key for testing
    corrector = SimplifiedSpeechCorrector(api_key="test-key")
    
    # Test cases for critical corrections
    test_cases = [
        "NSEW",
        "My state is NSEW",
        "I live in Victor",
        "Queens Land please",
        "rode number 123",
        "Para Mata suburb",
        "Normal text that should not change"
    ]
    
    print("Testing critical corrections:")
    for test_input in test_cases:
        result = await corrector.correct_speech_input(test_input, "state_collection")
        
        if result["method"] != "no_change":
            print(f"✅ '{test_input}' -> '{result['corrected']}' (method: {result['method']})")
        else:
            print(f"🔘 '{test_input}' -> no change needed")
    
    print("\n" + "=" * 50)
    print("✅ Speech correction test completed!")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_speech_correction())