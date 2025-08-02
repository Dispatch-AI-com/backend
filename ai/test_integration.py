#!/usr/bin/env python3
"""
Integration test for LLM-first speech correction with call handler
"""

import sys
import os
import asyncio

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

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
            "expected_correction": "NSW"
        },
        {
            "name": "Street Type Error", 
            "input": "123 King rode",
            "expected_correction": "Road"
        },
        {
            "name": "Multiple Errors",
            "input": "My address is five six Victor rode in Queens Land",
            "expected_correction": "VIC Road QLD"
        },
        {
            "name": "Suburb Name Error",
            "input": "I'm from Para Mata",
            "expected_correction": "Parramatta"
        }
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
            "available_services": []
        }
        
        # Test address collection with speech correction
        try:
            updated_state = await cs_agent.process_address_collection(state, call_sid="test_call_123")
            
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
                print(f"LLM Response: {updated_state['last_llm_response'].get('response', 'No response')[:100]}...")
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
        
        print("-" * 40)


async def test_performance_and_caching():
    """Test performance and caching of the LLM speech corrector"""
    
    cs_agent = CustomerServiceLangGraph(api_key="test-key")
    
    print("\nPerformance and Caching Test")
    print("=" * 40)
    
    # Test the same input multiple times to verify caching
    test_input = "I live in NSEW"
    
    import time
    
    # First call (should take longer)
    start_time = time.time()
    correction_result = await cs_agent.speech_corrector.correct_speech_input(test_input, "address_collection")
    first_call_time = time.time() - start_time
    
    print(f"First call: {first_call_time*1000:.1f}ms")
    print(f"Result: {correction_result['corrected']}")
    print(f"Method: {correction_result['method']}")
    print(f"Cached: {correction_result.get('cached', False)}")
    
    # Second call (should be faster due to caching)
    start_time = time.time()
    cached_result = await cs_agent.speech_corrector.correct_speech_input(test_input, "address_collection")
    second_call_time = time.time() - start_time
    
    print(f"Second call: {second_call_time*1000:.1f}ms")
    print(f"Cached: {cached_result.get('cached', False)}")
    
    # Performance statistics
    stats = cs_agent.speech_corrector.get_performance_stats()
    print(f"Cache stats: {stats['cache_stats']}")
    
    if second_call_time < first_call_time * 0.1:  # Should be at least 10x faster
        print("✅ Caching is working effectively")
    else:
        print("⚠️ Caching may not be working optimally")


async def main():
    """Main test function"""
    print("🧪 Starting LLM-First Speech Correction Integration Tests\n")
    
    await test_address_collection_integration()
    await test_performance_and_caching()
    
    print("\n🎉 Integration tests completed!")


if __name__ == "__main__":
    asyncio.run(main())