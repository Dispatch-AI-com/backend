"""
Edge Case Test Cases

Test cases for potentially ambiguous situations that test the boundaries
between different intent classifications.
"""

EDGE_CASE_TEST_CASES = [
    {
        "id": "edge_001",
        "message": "Do I need to pay the enrollment fee upfront?",
        "expected_intent": "other",
        "min_confidence": 0.70,
        "description": "Edge: Payment inquiry (not opportunity, requires clarification)"
    },
    {
        "id": "edge_002",
        "message": "I'm having trouble understanding this. Can someone help me?",
        "expected_intent": "other",
        "min_confidence": 0.65,
        "description": "Edge: Unclear help request (should be OTHER)"
    },
    {
        "id": "edge_003",
        "message": "I need this information urgently for tomorrow.",
        "expected_intent": "other",
        "min_confidence": 0.65,
        "description": "Edge: Urgent but vague request (should be OTHER)"
    },
    {
        "id": "edge_004",
        "message": "Do you accept cash payments?",
        "expected_intent": "other",
        "min_confidence": 0.75,
        "description": "Edge: Payment method inquiry (not opportunity)"
    },
    {
        "id": "edge_005",
        "message": "I need to discuss a complex issue about my enrollment.",
        "expected_intent": "other",
        "min_confidence": 0.70,
        "description": "Edge: Complex issue (should be OTHER)"
    }
]
