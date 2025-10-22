"""
FAQ Intent Test Cases

Test cases for validating FAQ (common student questions) intent classification.
Each test case includes expected intent and minimum confidence threshold.
"""

FAQ_TEST_CASES = [
    {
        "id": "faq_001",
        "message": "What are your office hours?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Office hours inquiry"
    },
    {
        "id": "faq_002",
        "message": "When is the enrollment deadline for next semester?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Enrollment deadline inquiry"
    },
    {
        "id": "faq_003",
        "message": "What time do you open?",
        "expected_intent": "faq",
        "min_confidence": 0.90,
        "description": "Opening hours question"
    },
    {
        "id": "faq_004",
        "message": "How much are the tuition fees for international students?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Tuition fee inquiry"
    },
    {
        "id": "faq_005",
        "message": "Where is your office located?",
        "expected_intent": "faq",
        "min_confidence": 0.90,
        "description": "Location inquiry"
    },
    {
        "id": "faq_006",
        "message": "What's your phone number?",
        "expected_intent": "faq",
        "min_confidence": 0.90,
        "description": "Contact information request"
    },
    {
        "id": "faq_007",
        "message": "Do you have weekend hours?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Weekend availability question"
    },
    {
        "id": "faq_008",
        "message": "What documents do I need for enrollment?",
        "expected_intent": "faq",
        "min_confidence": 0.80,
        "description": "Required documents question"
    },
    {
        "id": "faq_009",
        "message": "What services do you provide?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Services offered inquiry"
    },
    {
        "id": "faq_010",
        "message": "What are the application deadlines?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Application deadline question"
    },
    {
        "id": "faq_011",
        "message": "Do you accept international students?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "International student acceptance"
    },
    {
        "id": "faq_012",
        "message": "What's your email address?",
        "expected_intent": "faq",
        "min_confidence": 0.90,
        "description": "Email contact inquiry"
    },
    {
        "id": "faq_013",
        "message": "What time do you close?",
        "expected_intent": "faq",
        "min_confidence": 0.90,
        "description": "Closing time question"
    },
    {
        "id": "faq_014",
        "message": "What payment methods do you accept?",
        "expected_intent": "faq",
        "min_confidence": 0.80,
        "description": "Payment methods question"
    },
    {
        "id": "faq_015",
        "message": "Where can I find your address?",
        "expected_intent": "faq",
        "min_confidence": 0.85,
        "description": "Address inquiry"
    }
]
