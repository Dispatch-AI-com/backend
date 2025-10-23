"""
Intent Classification Testing Demo

Quick demonstration of the testing and fine-tuning system.
Runs a small subset of tests to show capabilities.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from intent_classification import IntentClassifier
from intent_classification.tests.test_data import (
    SCAM_TEST_CASES,
    OPPORTUNITY_TEST_CASES,
    OTHER_TEST_CASES
)


async def demo():
    """Run a quick demo of the classification system"""
    print("=" * 70)
    print("INTENT CLASSIFICATION TESTING DEMO")
    print("=" * 70)
    print()

    classifier = IntentClassifier()

    # Select demo cases
    demo_cases = [
        SCAM_TEST_CASES[0],          # SCAM example
        OPPORTUNITY_TEST_CASES[0],   # OPPORTUNITY example
        OTHER_TEST_CASES[0],         # OTHER example
    ]

    print("Testing 3 sample cases (1 from each intent)...")
    print()

    correct = 0
    total = len(demo_cases)

    for i, test_case in enumerate(demo_cases, 1):
        print(f"Test {i}/{total}: {test_case['id']}")
        print(f"Message: \"{test_case['message'][:80]}...\"")
        print(f"Expected: {test_case['expected_intent']}")

        # Classify
        result = await classifier.classify_intent(test_case['message'])

        # Check result
        is_correct = result['intent'] == test_case['expected_intent']
        if is_correct:
            correct += 1

        status = "✅ CORRECT" if is_correct else "❌ WRONG"
        print(f"Predicted: {result['intent']} (confidence: {result['confidence']:.2f}) {status}")
        print(f"Reasoning: {result['reasoning'][:100]}...")
        print()

    # Summary
    accuracy = correct / total
    print("=" * 70)
    print(f"DEMO RESULTS: {correct}/{total} correct ({accuracy:.1%} accuracy)")
    print("=" * 70)
    print()

    print("For full test suite with 50 cases, run:")
    print("  ./app/intent_classification/tests/run_tests.sh")
    print()
    print("Or see QUICK_START.md for more options.")
    print()


if __name__ == "__main__":
    asyncio.run(demo())
