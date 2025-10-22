"""
Intent Classification API Routes

FastAPI endpoints for intent classification.
Provides classification, testing, and definition retrieval endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# Import from intent_classification module
from ..models.requests import IntentClassificationRequest
from ..models.responses import IntentClassificationResponse, IntentDefinition
from ..services.classifier import intent_classifier
from ..definitions.intent_definitions import (
    get_scam_definition,
    get_opportunity_definition,
    get_other_definition
)
from ..tests.test_data import ALL_TEST_CASES


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
          "currentMessage": "What are your office hours?"
        }

        Response:
        {
          "intent": "opportunity",
          "confidence": 0.92,
          "reasoning": "Legitimate job interview invitation",
          "metadata": {
            "matched_keywords": ["interview", "job"],
            "matched_characteristics": ["Mentions of job interviews or interview invitations"]
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
          "scam": {
            "name": "scam",
            "description": "Scam calls or malicious callers attempting fraud",
            "characteristics": [...],
            "positive_examples": [...],
            "negative_examples": [...],
            "keywords": [...]
          },
          "opportunity": {
            "name": "opportunity",
            "description": "Legitimate opportunities for students (interviews, jobs, research)",
            "characteristics": [...],
            "positive_examples": [...],
            "negative_examples": [...],
            "keywords": [...]
          },
          "other": {
            "name": "other",
            "description": "Unrecognized intents requiring human handling",
            "characteristics": [...],
            "positive_examples": [...],
            "negative_examples": [...],
            "keywords": [...]
          }
        }
        ```
    """
    return {
        "scam": IntentDefinition(**get_scam_definition()),
        "opportunity": IntentDefinition(**get_opportunity_definition()),
        "other": IntentDefinition(**get_other_definition())
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
            "scam": {"tests": 15, "passed": 14, "accuracy": 0.93},
            "opportunity": {"tests": 15, "passed": 15, "accuracy": 1.0},
            "other": {"tests": 15, "passed": 13, "accuracy": 0.87}
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
