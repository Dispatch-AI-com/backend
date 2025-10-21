"""
Intent Classification Test Data

Test cases for validating intent classification accuracy in student service context.
Each test case includes expected intent and minimum confidence threshold.
"""

# SCAM_CALL test cases
SCAM_CALL_TEST_CASES = [
    {
        "id": "scam_001",
        "message": "This is the Australian Tax Office. You have unpaid taxes of $5000 and must transfer immediately or face prosecution.",
        "expected_intent": "scam_call",
        "min_confidence": 0.85,
        "description": "Tax office impersonation scam"
    },
    {
        "id": "scam_002",
        "message": "Your bank account has been frozen. Please provide your account number and password to unlock it.",
        "expected_intent": "scam_call",
        "min_confidence": 0.90,
        "description": "Bank account scam requesting credentials"
    },
    {
        "id": "scam_003",
        "message": "This is the police. You are suspected of money laundering and must transfer bail money to a secure account immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.85,
        "description": "Police impersonation scam"
    },
    {
        "id": "scam_004",
        "message": "Congratulations! You've won a million dollars, but you need to pay $5000 processing fee first to claim your prize.",
        "expected_intent": "scam_call",
        "min_confidence": 0.80,
        "description": "Lottery scam with upfront fee"
    },
    {
        "id": "scam_005",
        "message": "Your package has been seized by customs. Pay the $3000 fine immediately or it will be destroyed.",
        "expected_intent": "scam_call",
        "min_confidence": 0.80,
        "description": "Customs scam with threats"
    },
    {
        "id": "scam_006",
        "message": "This is Medicare calling. Your account has suspicious activity. Please provide your bank details immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.85,
        "description": "Medicare impersonation"
    },
    {
        "id": "scam_007",
        "message": "Your internet will be disconnected in 24 hours. Press 1 to make immediate payment.",
        "expected_intent": "scam_call",
        "min_confidence": 0.75,
        "description": "Internet disconnection threat"
    },
    {
        "id": "scam_008",
        "message": "Your Centrelink benefits have been frozen. Please provide your bank account and Tax File Number immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.85,
        "description": "Centrelink scam requesting TFN"
    },
    {
        "id": "scam_009",
        "message": "This is a court notice. You have unprocessed legal documents. An arrest warrant will be issued if you don't act immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.80,
        "description": "Court/legal threat scam"
    },
    {
        "id": "scam_010",
        "message": "Your credit card has suspicious transactions. Please provide your card number and CVV to verify your identity.",
        "expected_intent": "scam_call",
        "min_confidence": 0.85,
        "description": "Credit card verification scam"
    },
    {
        "id": "scam_011",
        "message": "You need to purchase iTunes gift cards worth $2000 to pay your tax debt immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.90,
        "description": "Gift card payment scam (obvious fraud)"
    },
    {
        "id": "scam_012",
        "message": "Your computer has viruses. We are Microsoft technical support and need remote access to fix it.",
        "expected_intent": "scam_call",
        "min_confidence": 0.80,
        "description": "Tech support scam"
    },
    {
        "id": "scam_013",
        "message": "Urgent: Your visa is expiring. Pay the renewal fee immediately or you will be deported.",
        "expected_intent": "scam_call",
        "min_confidence": 0.75,
        "description": "Visa/deportation threat"
    },
    {
        "id": "scam_014",
        "message": "Investment opportunity: Guaranteed 20% monthly returns. You must decide and transfer at least $10,000 now.",
        "expected_intent": "scam_call",
        "min_confidence": 0.70,
        "description": "Investment scam with unrealistic returns"
    },
    {
        "id": "scam_015",
        "message": "Hi, this is your grandson. I'm in an emergency and need money urgently. Please transfer immediately.",
        "expected_intent": "scam_call",
        "min_confidence": 0.75,
        "description": "Family member impersonation scam"
    }
]

# INQUIRY test cases (student questions)
INQUIRY_TEST_CASES = [
    {
        "id": "inquiry_001",
        "message": "What are the prerequisites for the Advanced Programming course?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Course prerequisite question"
    },
    {
        "id": "inquiry_002",
        "message": "When is the enrollment deadline for next semester?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Enrollment deadline inquiry"
    },
    {
        "id": "inquiry_003",
        "message": "What are your office hours?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Office hours question"
    },
    {
        "id": "inquiry_004",
        "message": "How much are the tuition fees for international students?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Tuition fee inquiry"
    },
    {
        "id": "inquiry_005",
        "message": "Where can I find information about campus housing?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Campus housing information"
    },
    {
        "id": "inquiry_006",
        "message": "What documents do I need to bring for registration?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Registration requirements"
    },
    {
        "id": "inquiry_007",
        "message": "Are there any scholarships available for computer science students?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Scholarship availability"
    },
    {
        "id": "inquiry_008",
        "message": "Can you tell me about the student exchange program?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Exchange program inquiry"
    },
    {
        "id": "inquiry_009",
        "message": "What time does the library close on weekends?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Library hours question"
    },
    {
        "id": "inquiry_010",
        "message": "How do I apply for financial aid?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Financial aid application process"
    },
    {
        "id": "inquiry_011",
        "message": "What's the refund policy if I withdraw from a course?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Course withdrawal policy"
    },
    {
        "id": "inquiry_012",
        "message": "Is there a career counseling service available for students?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Career services inquiry"
    },
    {
        "id": "inquiry_013",
        "message": "Can I take courses from different faculties?",
        "expected_intent": "inquiry",
        "min_confidence": 0.75,
        "description": "Cross-faculty enrollment"
    },
    {
        "id": "inquiry_014",
        "message": "What payment methods do you accept for tuition fees?",
        "expected_intent": "inquiry",
        "min_confidence": 0.80,
        "description": "Payment methods question"
    },
    {
        "id": "inquiry_015",
        "message": "How many credits do I need to graduate?",
        "expected_intent": "inquiry",
        "min_confidence": 0.85,
        "description": "Graduation requirements"
    }
]

# LEAVE_MESSAGE test cases (callback requests only, NOT human transfer)
LEAVE_MESSAGE_TEST_CASES = [
    {
        "id": "message_001",
        "message": "I can't talk right now. Can I leave a message?",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Direct message leaving request"
    },
    {
        "id": "message_002",
        "message": "Can someone call me back later?",
        "expected_intent": "leave_message",
        "min_confidence": 0.90,
        "description": "Callback request"
    },
    {
        "id": "message_003",
        "message": "I'm busy right now. Please have someone contact me when they're available.",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Unavailable, requesting contact"
    },
    {
        "id": "message_004",
        "message": "I'd like to leave a message for the admissions office.",
        "expected_intent": "leave_message",
        "min_confidence": 0.90,
        "description": "Message for specific department"
    },
    {
        "id": "message_005",
        "message": "Can you take a message? I'll wait for a callback.",
        "expected_intent": "leave_message",
        "min_confidence": 0.90,
        "description": "Message with callback expectation"
    },
    {
        "id": "message_006",
        "message": "I'm driving right now. Can I leave some information and get a call back?",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Driving, needs callback"
    },
    {
        "id": "message_007",
        "message": "Just take down my details and someone can contact me later.",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Leave details for later contact"
    },
    {
        "id": "message_008",
        "message": "I need to leave a voicemail.",
        "expected_intent": "leave_message",
        "min_confidence": 0.90,
        "description": "Voicemail request"
    },
    {
        "id": "message_009",
        "message": "Could you record this message for me?",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Message recording request"
    },
    {
        "id": "message_010",
        "message": "I'm in class right now. Can I leave a message and get called back?",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "In class, needs callback"
    },
    {
        "id": "message_011",
        "message": "Please have the registrar's office call me when they have time.",
        "expected_intent": "leave_message",
        "min_confidence": 0.80,
        "description": "Department callback request"
    },
    {
        "id": "message_012",
        "message": "I'll leave my contact information and wait for someone to reach out.",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "Leave contact info for follow-up"
    },
    {
        "id": "message_013",
        "message": "Can you let them know I called? I'll be available after 3pm.",
        "expected_intent": "leave_message",
        "min_confidence": 0.80,
        "description": "Message with availability window"
    },
    {
        "id": "message_014",
        "message": "I'm in a meeting. Take a message and I'll wait for the callback.",
        "expected_intent": "leave_message",
        "min_confidence": 0.85,
        "description": "In meeting, callback needed"
    },
    {
        "id": "message_015",
        "message": "Just leave a note that I called about my enrollment status.",
        "expected_intent": "leave_message",
        "min_confidence": 0.80,
        "description": "Leave note about specific topic"
    }
]

# Edge case test cases - potentially ambiguous situations
EDGE_CASE_TEST_CASES = [
    {
        "id": "edge_001",
        "message": "Do I need to pay the enrollment fee upfront?",
        "expected_intent": "inquiry",
        "min_confidence": 0.70,
        "description": "Edge: Payment inquiry vs scam (should be inquiry)"
    },
    {
        "id": "edge_002",
        "message": "I'm having trouble understanding this. Can someone help me?",
        "expected_intent": "inquiry",
        "min_confidence": 0.65,
        "description": "Edge: Help request (general inquiry)"
    },
    {
        "id": "edge_003",
        "message": "I need this information urgently for tomorrow.",
        "expected_intent": "inquiry",
        "min_confidence": 0.65,
        "description": "Edge: Urgent but legitimate request"
    },
    {
        "id": "edge_004",
        "message": "Do you accept cash payments?",
        "expected_intent": "inquiry",
        "min_confidence": 0.75,
        "description": "Edge: Payment method inquiry"
    },
    {
        "id": "edge_005",
        "message": "I need to discuss a complex issue about my enrollment.",
        "expected_intent": "inquiry",
        "min_confidence": 0.70,
        "description": "Edge: Complex issue (still inquiry, not message)"
    }
]

# All test cases combined
ALL_TEST_CASES = {
    "scam_call": SCAM_CALL_TEST_CASES,
    "inquiry": INQUIRY_TEST_CASES,
    "leave_message": LEAVE_MESSAGE_TEST_CASES,
    "edge_cases": EDGE_CASE_TEST_CASES
}
