"""
OTHER Intent Test Cases

Test cases for validating OTHER (complex issues, messages, unclear intents) intent classification.
Each test case includes expected intent and minimum confidence threshold.
"""

OTHER_TEST_CASES = [
    {
        "id": "other_001",
        "message": "I can't talk right now. Can I leave a message?",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Direct message leaving request"
    },
    {
        "id": "other_002",
        "message": "Can someone call me back later?",
        "expected_intent": "other",
        "min_confidence": 0.90,
        "description": "Callback request"
    },
    {
        "id": "other_003",
        "message": "I have a special situation regarding my visa that needs discussion",
        "expected_intent": "other",
        "min_confidence": 0.80,
        "description": "Complex visa situation"
    },
    {
        "id": "other_004",
        "message": "I can't talk now, but I need to leave some information",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Unavailable, needs to leave info"
    },
    {
        "id": "other_005",
        "message": "I need to speak with someone about a complex enrollment issue",
        "expected_intent": "other",
        "min_confidence": 0.80,
        "description": "Complex enrollment discussion needed"
    },
    {
        "id": "other_006",
        "message": "This is regarding a personal matter that requires individual attention",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Personal matter requiring individual attention"
    },
    {
        "id": "other_007",
        "message": "I'm not satisfied with how my case was handled",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Complaint about case handling"
    },
    {
        "id": "other_008",
        "message": "Can I schedule a one-on-one consultation?",
        "expected_intent": "other",
        "min_confidence": 0.80,
        "description": "Individual consultation request"
    },
    {
        "id": "other_009",
        "message": "I have multiple questions that need detailed discussion",
        "expected_intent": "other",
        "min_confidence": 0.80,
        "description": "Multiple complex questions"
    },
    {
        "id": "other_010",
        "message": "My situation is complicated and I need personalized help",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Complicated situation needing personalized help"
    },
    {
        "id": "other_011",
        "message": "I'm busy right now. Please have someone contact me when they're available.",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Busy, requesting later contact"
    },
    {
        "id": "other_012",
        "message": "I'd like to leave a message for the admissions office.",
        "expected_intent": "other",
        "min_confidence": 0.90,
        "description": "Message for specific department"
    },
    {
        "id": "other_013",
        "message": "I need help with a unique immigration case",
        "expected_intent": "other",
        "min_confidence": 0.80,
        "description": "Unique immigration situation"
    },
    {
        "id": "other_014",
        "message": "Can someone review my special circumstances?",
        "expected_intent": "other",
        "min_confidence": 0.75,
        "description": "Special circumstances review"
    },
    {
        "id": "other_015",
        "message": "I'm driving right now, can you have someone call me back?",
        "expected_intent": "other",
        "min_confidence": 0.85,
        "description": "Driving, needs callback"
    }
]
