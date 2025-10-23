"""
OPPORTUNITY Intent Test Cases

Test cases for validating OPPORTUNITY (legitimate interviews, jobs, research, internships) intent classification.
Each test case includes expected intent and minimum confidence threshold.
"""

OPPORTUNITY_TEST_CASES = [
    {
        "id": "opportunity_001",
        "message": "We'd like to invite you for a job interview next week. When are you available?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Job interview invitation with availability request"
    },
    {
        "id": "opportunity_002",
        "message": "Our company has an internship position available. Are you interested?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Internship opportunity offer"
    },
    {
        "id": "opportunity_003",
        "message": "I'm a professor looking for research assistants. Would you like to discuss this opportunity?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Research assistant opportunity from professor"
    },
    {
        "id": "opportunity_004",
        "message": "There's a career fair on campus next Friday. Can we schedule a time to meet?",
        "expected_intent": "opportunity",
        "min_confidence": 0.80,
        "description": "Career fair networking opportunity"
    },
    {
        "id": "opportunity_005",
        "message": "We received your application and would like to schedule an interview.",
        "expected_intent": "opportunity",
        "min_confidence": 0.90,
        "description": "Interview scheduling for application"
    },
    {
        "id": "opportunity_006",
        "message": "Our startup is hiring international students. Can we send you more information?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Startup hiring with info request"
    },
    {
        "id": "opportunity_007",
        "message": "I'm organizing a networking event for tech professionals. Would you like to attend?",
        "expected_intent": "opportunity",
        "min_confidence": 0.80,
        "description": "Professional networking event invitation"
    },
    {
        "id": "opportunity_008",
        "message": "We have a scholarship opportunity for international students.",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Scholarship opportunity notification"
    },
    {
        "id": "opportunity_009",
        "message": "Our lab is looking for graduate research assistants. Can we set up a meeting?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Graduate research position with meeting request"
    },
    {
        "id": "opportunity_010",
        "message": "There's an internship opening in our marketing department.",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Marketing internship opening"
    },
    {
        "id": "opportunity_011",
        "message": "We're hosting a workshop on career development. Would you like to join?",
        "expected_intent": "opportunity",
        "min_confidence": 0.75,
        "description": "Career development workshop invitation"
    },
    {
        "id": "opportunity_012",
        "message": "I'd like to discuss a potential research collaboration. What's your email address?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Research collaboration with contact request"
    },
    {
        "id": "opportunity_013",
        "message": "Our company is recruiting for entry-level positions. When can we talk?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Entry-level recruitment with availability request"
    },
    {
        "id": "opportunity_014",
        "message": "There's a PhD opening in our department. Would you be interested in applying?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "PhD position opportunity"
    },
    {
        "id": "opportunity_015",
        "message": "We're looking for interns for summer. Can I get your resume?",
        "expected_intent": "opportunity",
        "min_confidence": 0.85,
        "description": "Summer internship with resume request"
    }
]
