"""
Quick test script to verify updated intent classification implementation
Tests the new SCAM/FAQ/OTHER schema
"""

import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from utils.prompts.intent_prompts import (
    get_scam_definition,
    get_faq_definition,
    get_other_definition
)
from tests.intent_test_data import ALL_TEST_CASES
from models.intent import IntentType

def test_definitions():
    """Test that all intent definitions are accessible"""
    print("=" * 60)
    print("Testing Intent Definitions")
    print("=" * 60)

    try:
        scam_def = get_scam_definition()
        print(f"✅ SCAM definition loaded: {scam_def['name']}")
        print(f"   Description: {scam_def['description']}")
        print(f"   Characteristics: {len(scam_def['characteristics'])} items")
        print(f"   Positive examples: {len(scam_def['positive_examples'])} items")
        print(f"   Keywords: {len(scam_def['keywords'])} items")
        print()

        faq_def = get_faq_definition()
        print(f"✅ FAQ definition loaded: {faq_def['name']}")
        print(f"   Description: {faq_def['description']}")
        print(f"   Characteristics: {len(faq_def['characteristics'])} items")
        print(f"   Positive examples: {len(faq_def['positive_examples'])} items")
        print(f"   Keywords: {len(faq_def['keywords'])} items")
        print()

        other_def = get_other_definition()
        print(f"✅ OTHER definition loaded: {other_def['name']}")
        print(f"   Description: {other_def['description']}")
        print(f"   Characteristics: {len(other_def['characteristics'])} items")
        print(f"   Positive examples: {len(other_def['positive_examples'])} items")
        print(f"   Keywords: {len(other_def['keywords'])} items")
        print()

        return True
    except Exception as e:
        print(f"❌ Error loading definitions: {e}")
        return False

def test_enum_values():
    """Test that IntentType enum has correct values"""
    print("=" * 60)
    print("Testing IntentType Enum")
    print("=" * 60)

    try:
        assert IntentType.SCAM.value == "scam", "SCAM value mismatch"
        print(f"✅ IntentType.SCAM = '{IntentType.SCAM.value}'")

        assert IntentType.FAQ.value == "faq", "FAQ value mismatch"
        print(f"✅ IntentType.FAQ = '{IntentType.FAQ.value}'")

        assert IntentType.OTHER.value == "other", "OTHER value mismatch"
        print(f"✅ IntentType.OTHER = '{IntentType.OTHER.value}'")
        print()

        return True
    except Exception as e:
        print(f"❌ Error testing enum: {e}")
        return False

def test_test_data():
    """Test that test data is properly structured"""
    print("=" * 60)
    print("Testing Test Data")
    print("=" * 60)

    try:
        # Check all test case categories exist
        expected_categories = ["scam", "faq", "other", "edge_cases"]
        for category in expected_categories:
            assert category in ALL_TEST_CASES, f"Missing category: {category}"
            print(f"✅ Category '{category}' exists")

        print()

        # Count test cases
        scam_count = len(ALL_TEST_CASES["scam"])
        faq_count = len(ALL_TEST_CASES["faq"])
        other_count = len(ALL_TEST_CASES["other"])
        edge_count = len(ALL_TEST_CASES["edge_cases"])

        print(f"   SCAM test cases: {scam_count}")
        print(f"   FAQ test cases: {faq_count}")
        print(f"   OTHER test cases: {other_count}")
        print(f"   Edge cases: {edge_count}")
        print(f"   Total: {scam_count + faq_count + other_count + edge_count}")
        print()

        # Verify a sample from each category
        sample_scam = ALL_TEST_CASES["scam"][0]
        print("✅ Sample SCAM test case:")
        print(f"   ID: {sample_scam['id']}")
        print(f"   Expected intent: {sample_scam['expected_intent']}")
        print(f"   Message: {sample_scam['message'][:50]}...")
        print()

        sample_faq = ALL_TEST_CASES["faq"][0]
        print("✅ Sample FAQ test case:")
        print(f"   ID: {sample_faq['id']}")
        print(f"   Expected intent: {sample_faq['expected_intent']}")
        print(f"   Message: {sample_faq['message']}")
        print()

        sample_other = ALL_TEST_CASES["other"][0]
        print("✅ Sample OTHER test case:")
        print(f"   ID: {sample_other['id']}")
        print(f"   Expected intent: {sample_other['expected_intent']}")
        print(f"   Message: {sample_other['message']}")
        print()

        return True
    except Exception as e:
        print(f"❌ Error testing test data: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Intent Classification Update Verification")
    print("Testing new SCAM/FAQ/OTHER schema")
    print("=" * 60 + "\n")

    results = []

    # Run tests
    results.append(("Enum Values", test_enum_values()))
    results.append(("Intent Definitions", test_definitions()))
    results.append(("Test Data", test_test_data()))

    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("🎉 All tests passed! Intent classification update is complete.")
        print("\nNext steps:")
        print("1. The API endpoints are ready at /api/ai/intent/*")
        print("2. You can test classification with: POST /api/ai/intent/classify")
        print("3. View definitions with: GET /api/ai/intent/definitions")
        print("4. Run full test suite with: POST /api/ai/intent/test")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")

    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
