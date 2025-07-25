#!/usr/bin/env python3
"""
Test script for 8-step workflow refactoring
Validates that all components are properly structured without requiring external dependencies
"""

def test_prompt_functions():
    """Test that all prompt functions are available"""
    print("🧪 Testing prompt functions...")
    
    try:
        from app.utils.prompts.customer_info_prompts import (
            get_name_extraction_prompt,
            get_phone_extraction_prompt,
            get_street_extraction_prompt,
            get_suburb_extraction_prompt,
            get_state_extraction_prompt,
            get_postcode_extraction_prompt,
            get_email_extraction_prompt,
            get_service_extraction_prompt,
            get_time_extraction_prompt
        )
        
        # Test each prompt function
        prompts = [
            ("Name", get_name_extraction_prompt),
            ("Phone", get_phone_extraction_prompt),
            ("Street", get_street_extraction_prompt),
            ("Suburb", get_suburb_extraction_prompt),
            ("State", get_state_extraction_prompt),
            ("Postcode", get_postcode_extraction_prompt),
            ("Email", get_email_extraction_prompt),
            ("Service", get_service_extraction_prompt),
            ("Time", get_time_extraction_prompt)
        ]
        
        for name, func in prompts:
            prompt = func()
            assert isinstance(prompt, str) and len(prompt) > 0
            print(f"  ✅ {name} prompt: OK")
        
        print("✅ All prompt functions working correctly")
        return True
        
    except Exception as e:
        print(f"❌ Prompt functions test failed: {e}")
        return False

def test_extractor_functions():
    """Test that all extractor functions are available"""
    print("🧪 Testing extractor functions...")
    
    try:
        from app.services.retrieve.customer_info_extractors import (
            extract_name_from_conversation,
            extract_phone_from_conversation,
            extract_street_from_conversation,
            extract_suburb_from_conversation,
            extract_state_from_conversation,
            extract_postcode_from_conversation,
            extract_email_from_conversation,
            extract_service_from_conversation,
            extract_time_from_conversation
        )
        
        extractors = [
            "extract_name_from_conversation",
            "extract_phone_from_conversation", 
            "extract_street_from_conversation",
            "extract_suburb_from_conversation",
            "extract_state_from_conversation",
            "extract_postcode_from_conversation",
            "extract_email_from_conversation",
            "extract_service_from_conversation",
            "extract_time_from_conversation"
        ]
        
        for extractor_name in extractors:
            print(f"  ✅ {extractor_name}: OK")
            
        print("✅ All extractor functions available")
        return True
        
    except Exception as e:
        print(f"❌ Extractor functions test failed: {e}")
        return False

def test_state_definition():
    """Test CustomerServiceState definition"""
    print("🧪 Testing CustomerServiceState definition...")
    
    try:
        from app.services.call_handler import CustomerServiceState
        
        # Test that all required fields are in the TypedDict
        required_fields = [
            # User information
            "name", "phone", "street", "suburb", "state", "postcode", 
            "email", "service", "service_time",
            
            # Process control
            "current_step", "name_attempts", "phone_attempts", 
            "street_attempts", "suburb_attempts", "state_attempts", 
            "postcode_attempts", "email_attempts", "service_attempts", 
            "time_attempts", "max_attempts", "service_max_attempts",
            
            # Status flags
            "name_complete", "phone_complete", "street_complete", 
            "suburb_complete", "state_complete", "postcode_complete",
            "email_complete", "service_complete", "time_complete",
            "conversation_complete", "service_available", "time_available",
            
            # Other fields
            "last_user_input", "last_llm_response"
        ]
        
        # Get type annotations
        annotations = getattr(CustomerServiceState, '__annotations__', {})
        
        for field in required_fields:
            if field in annotations:
                print(f"  ✅ {field}: {annotations[field]}")
            else:
                print(f"  ❌ Missing field: {field}")
                return False
        
        print("✅ CustomerServiceState definition complete for 8-step workflow")
        return True
        
    except Exception as e:
        print(f"❌ CustomerServiceState test failed: {e}")
        return False

def test_workflow_structure():
    """Test the basic workflow structure"""
    print("🧪 Testing workflow structure...")
    
    try:
        # Check that the main class exists
        from app.services.call_handler import CustomerServiceLangGraph
        
        # Check that required methods exist
        methods = [
            "process_name_collection",
            "process_phone_collection", 
            "process_street_collection",
            "process_suburb_collection",
            "process_state_collection",
            "process_postcode_collection",
            "process_email_collection",
            "process_service_collection",
            "process_time_collection",
            "process_customer_workflow"
        ]
        
        for method_name in methods:
            if hasattr(CustomerServiceLangGraph, method_name):
                print(f"  ✅ {method_name}: OK")
            else:
                print(f"  ❌ Missing method: {method_name}")
                return False
        
        print("✅ All 8-step workflow methods available")
        return True
        
    except Exception as e:
        print(f"❌ Workflow structure test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing 8-Step AI Customer Service Workflow Refactoring")
    print("=" * 60)
    
    tests = [
        test_prompt_functions,
        test_extractor_functions, 
        test_state_definition,
        test_workflow_structure
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! 8-step workflow refactoring successful!")
        print("\n✨ New workflow steps:")
        print("   1. collect_name")
        print("   2. collect_phone") 
        print("   3. collect_street")
        print("   4. collect_suburb")
        print("   5. collect_state")
        print("   6. collect_postcode")
        print("   7. collect_email")
        print("   8. collect_service")
        print("   9. collect_time")
        return True
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    main()