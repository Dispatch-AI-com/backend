"""
Intent Classification API

Provides endpoints for classifying user intents in student service conversations.
This is a standalone API that does not affect existing workflows.
"""

from fastapi import APIRouter, HTTPException
from models.intent import (
    IntentClassificationRequest,
    IntentClassificationResponse,
    IntentDefinition
)
from services.intent_classifier import intent_classifier
from utils.prompts.intent_prompts import (
    get_scam_call_definition,
    get_inquiry_definition,
    get_leave_message_definition
)
from tests.intent_test_data import ALL_TEST_CASES
from typing import Dict, Any

router = APIRouter(
    prefix="/intent",
    tags=["Intent Classification"],
    responses={404: {"description": "Not found"}},
)


@router.post("/classify", response_model=IntentClassificationResponse)
async def classify_intent(data: IntentClassificationRequest):
    """Classify user intent from conversation

    Standalone endpoint that classifies user intent without affecting existing workflows.

    Args:
        data: Request containing current message and optional conversation history

    Returns:
        IntentClassificationResponse with intent, confidence, reasoning, and metadata

    Example:
        ```
        POST /api/ai/intent/classify
        {
          "currentMessage": "What are the prerequisites for CS101?"
        }

        Response:
        {
          "intent": "inquiry",
          "confidence": 0.92,
          "reasoning": "Student asking about course prerequisites, typical inquiry",
          "metadata": {
            "matched_keywords": ["prerequisites", "course"],
            "matched_characteristics": ["Asking about course requirements"]
          }
        }
        ```
    """
    try:
        # Classify intent
        result = await intent_classifier.classify_intent(
            current_message=data.currentMessage,
            message_history=data.messages,
            call_sid=data.callSid
        )

        return IntentClassificationResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Intent classification failed: {str(e)}"
        )


@router.get("/definitions")
async def get_intent_definitions() -> Dict[str, IntentDefinition]:
    """Get all intent definitions

    Returns the definition templates for all supported intent types.
    Useful for documentation and understanding classification criteria.

    Returns:
        Dictionary of intent definitions with characteristics, examples, and keywords

    Example:
        ```
        GET /api/ai/intent/definitions

        Response:
        {
          "scam_call": {
            "name": "scam_call",
            "description": "Scam calls or malicious callers...",
            "characteristics": [...],
            "positive_examples": [...],
            "negative_examples": [...],
            "keywords": [...]
          },
          ...
        }
        ```
    """
    return {
        "scam_call": IntentDefinition(**get_scam_call_definition()),
        "inquiry": IntentDefinition(**get_inquiry_definition()),
        "leave_message": IntentDefinition(**get_leave_message_definition())
    }


@router.post("/test")
async def test_intent_classifier() -> Dict[str, Any]:
    """Test intent classifier with predefined test cases

    Runs the classifier against all test cases and returns accuracy metrics.
    Useful for validating classifier performance and identifying issues.

    Returns:
        Test results with overall accuracy and per-intent breakdown

    Example:
        ```
        POST /api/ai/intent/test

        Response:
        {
          "total_tests": 45,
          "passed": 42,
          "failed": 3,
          "accuracy": 0.933,
          "by_intent": {
            "scam_call": {"tests": 15, "passed": 14, "accuracy": 0.93},
            "inquiry": {"tests": 15, "passed": 15, "accuracy": 1.0},
            "leave_message": {"tests": 15, "passed": 13, "accuracy": 0.87}
          },
          "failed_cases": [...]
        }
        ```
    """
    results = {
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "accuracy": 0.0,
        "by_intent": {},
        "failed_cases": []
    }

    # Test each intent category
    for intent_type, test_cases in ALL_TEST_CASES.items():
        if intent_type == "edge_cases":
            # Handle edge cases separately
            continue

        intent_results = {
            "tests": len(test_cases),
            "passed": 0,
            "failed": 0,
            "accuracy": 0.0,
            "failed_cases": []
        }

        for test_case in test_cases:
            results["total_tests"] += 1

            try:
                # Run classification
                result = await intent_classifier.classify_intent(
                    current_message=test_case["message"]
                )

                # Check if classification matches expected
                is_correct = (
                    result["intent"] == test_case["expected_intent"] and
                    result["confidence"] >= test_case["min_confidence"]
                )

                if is_correct:
                    results["passed"] += 1
                    intent_results["passed"] += 1
                else:
                    results["failed"] += 1
                    intent_results["failed"] += 1

                    # Record failure
                    failure_info = {
                        "test_id": test_case["id"],
                        "description": test_case["description"],
                        "message": test_case["message"],
                        "expected_intent": test_case["expected_intent"],
                        "actual_intent": result["intent"],
                        "expected_min_confidence": test_case["min_confidence"],
                        "actual_confidence": result["confidence"],
                        "reasoning": result["reasoning"]
                    }
                    results["failed_cases"].append(failure_info)
                    intent_results["failed_cases"].append(failure_info)

            except Exception as e:
                results["failed"] += 1
                intent_results["failed"] += 1
                results["failed_cases"].append({
                    "test_id": test_case["id"],
                    "description": test_case["description"],
                    "error": str(e)
                })

        # Calculate intent-specific accuracy
        if intent_results["tests"] > 0:
            intent_results["accuracy"] = intent_results["passed"] / intent_results["tests"]

        results["by_intent"][intent_type] = intent_results

    # Calculate overall accuracy
    if results["total_tests"] > 0:
        results["accuracy"] = results["passed"] / results["total_tests"]

    return results


@router.get("/health")
async def health_check():
    """Health check endpoint for intent classification service

    Returns:
        Status of the intent classification service
    """
    return {
        "status": "healthy",
        "service": "intent_classification",
        "version": "1.0.0"
    }
