#!/usr/bin/env python3
"""
Integration test for LLM-first speech correction with call handler
"""

import sys
import os
import asyncio

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.services.call_handler import CustomerServiceLangGraph
from app.custom_types import CustomerServiceState


async def test_address_collection_integration():
    """Test LLM-first speech correction integrated with address collection workflow"""

    # Create customer service instance with test API key
    cs_agent = CustomerServiceLangGraph(api_key="test-key")

    # Test cases simulating Twilio speech recognition errors
    test_cases = [
        {
            "name": "Australian State Name Error",
            "input": "I live in NSEW",
            "expected_correction": "NSW",
        },
        {
            "name": "Street Type Error",
            "input": "123 King rode",
            "expected_correction": "Road",
        },
        {
            "name": "Multiple Errors",
            "input": "My address is five six Victor rode in Queens Land",
            "expected_correction": "VIC Road QLD",
        },
        {
            "name": "Suburb Name Error",
            "input": "I'm from Para Mata",
            "expected_correction": "Parramatta",
        },
    ]

    print("LLM-First Speech Correction Integration Test")
    print("=" * 60)

    for test_case in test_cases:
        print(f"\nTest: {test_case['name']}")
        print(f"Input: {test_case['input']}")

        # Create state for address collection
        state: CustomerServiceState = {
            "name": "John Doe",
            "phone": "0412345678",
            "address": None,
            "service": None,
            "service_time": None,
            "current_step": "collect_address",
            "name_attempts": 0,
            "phone_attempts": 0,
            "address_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": 3,
            "service_max_attempts": 3,
            "last_user_input": test_case["input"],
            "last_llm_response": None,
            "name_complete": True,
            "phone_complete": True,
            "address_complete": False,
            "service_complete": False,
            "time_complete": False,
            "conversation_complete": False,
            "service_available": True,
            "time_available": True,
            "available_services": [],
        }

        # Test address collection with speech correction
        try:
            updated_state = await cs_agent.process_address_collection(
                state, call_sid="test_call_123"
            )

            # Check if speech correction was applied
            corrected_input = updated_state.get("last_user_input", "")

            print(f"Corrected: {corrected_input}")

            # Check if expected correction was applied
            if test_case["expected_correction"] in corrected_input:
                print("✅ Speech correction applied successfully")
            else:
                print("⚠️ Expected correction not found")

            # Check LLM response
            if updated_state.get("last_llm_response"):
                print(
                    f"LLM Response: {updated_state['last_llm_response'].get('response', 'No response')[:100]}..."
                )

        except Exception as e:
            print(f"❌ Test failed with error: {e}")

        print("-" * 40)


async def test_performance():
    """Test performance of the simplified speech corrector"""

    cs_agent = CustomerServiceLangGraph(api_key="test-key")

    print("\nPerformance Test")
    print("=" * 40)

    # Test critical correction performance
    test_input = "I live in NSEW"

    import time

    # Critical correction call (should be very fast)
    start_time = time.time()
    correction_result = await cs_agent.speech_corrector.correct_speech_input(
        test_input, "address_collection"
    )
    first_call_time = time.time() - start_time

    print(f"Critical correction: {first_call_time * 1000:.1f}ms")
    print(f"Result: {correction_result['corrected']}")
    print(f"Method: {correction_result['method']}")

    # Test LLM call performance (complex input)
    complex_input = "My postcode is three oh oh eight"
    start_time = time.time()
    llm_result = await cs_agent.speech_corrector.correct_speech_input(
        complex_input, "address_collection"
    )
    llm_call_time = time.time() - start_time

    print(f"LLM call: {llm_call_time * 1000:.1f}ms")
    print(f"Result: {llm_result['corrected']}")
    print(f"Method: {llm_result['method']}")

    # Performance statistics
    print(f"Timeout setting: {cs_agent.speech_corrector.timeout_seconds}s")
    print(f"Max retries: {cs_agent.speech_corrector.max_retries}")

    if first_call_time < 0.01:  # Should be very fast for critical corrections
        print("✅ Critical corrections are working efficiently")
    else:
        print("⚠️ Performance may need optimization")


async def main():
    """Main test function"""
    print("🧪 Starting LLM-First Speech Correction Integration Tests\n")

    await test_address_collection_integration()
    await test_performance()

    print("\n🎉 Integration tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
