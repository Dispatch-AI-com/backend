"""
SCAM Intent Test Cases

Test cases for validating SCAM (fraud/malicious caller) intent classification.
Each test case includes expected intent and minimum confidence threshold.
"""

SCAM_TEST_CASES = [
    {
        "id": "scam_001",
        "message": "This is the Australian Tax Office. You have unpaid taxes of $5000 and must transfer immediately or face prosecution.",
        "expected_intent": "scam",
        "min_confidence": 0.85,
        "description": "Tax office impersonation scam"
    },
    {
        "id": "scam_002",
        "message": "Your bank account has been frozen. Please provide your account number and password to unlock it.",
        "expected_intent": "scam",
        "min_confidence": 0.90,
        "description": "Bank account scam requesting credentials"
    },
    {
        "id": "scam_003",
        "message": "This is the police. You are suspected of money laundering and must transfer bail money to a secure account immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.85,
        "description": "Police impersonation scam"
    },
    {
        "id": "scam_004",
        "message": "Congratulations! You've won a million dollars, but you need to pay $5000 processing fee first to claim your prize.",
        "expected_intent": "scam",
        "min_confidence": 0.80,
        "description": "Lottery scam with upfront fee"
    },
    {
        "id": "scam_005",
        "message": "Your package has been seized by customs. Pay the $3000 fine immediately or it will be destroyed.",
        "expected_intent": "scam",
        "min_confidence": 0.80,
        "description": "Customs scam with threats"
    },
    {
        "id": "scam_006",
        "message": "This is Medicare calling. Your account has suspicious activity. Please provide your bank details immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.85,
        "description": "Medicare impersonation"
    },
    {
        "id": "scam_007",
        "message": "Your internet will be disconnected in 24 hours. Press 1 to make immediate payment.",
        "expected_intent": "scam",
        "min_confidence": 0.75,
        "description": "Internet disconnection threat"
    },
    {
        "id": "scam_008",
        "message": "Your Centrelink benefits have been frozen. Please provide your bank account and Tax File Number immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.85,
        "description": "Centrelink scam requesting TFN"
    },
    {
        "id": "scam_009",
        "message": "This is a court notice. You have unprocessed legal documents. An arrest warrant will be issued if you don't act immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.80,
        "description": "Court/legal threat scam"
    },
    {
        "id": "scam_010",
        "message": "Your credit card has suspicious transactions. Please provide your card number and CVV to verify your identity.",
        "expected_intent": "scam",
        "min_confidence": 0.85,
        "description": "Credit card verification scam"
    },
    {
        "id": "scam_011",
        "message": "You need to purchase iTunes gift cards worth $2000 to pay your tax debt immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.90,
        "description": "Gift card payment scam (obvious fraud)"
    },
    {
        "id": "scam_012",
        "message": "Your computer has viruses. We are Microsoft technical support and need remote access to fix it.",
        "expected_intent": "scam",
        "min_confidence": 0.80,
        "description": "Tech support scam"
    },
    {
        "id": "scam_013",
        "message": "Urgent: Your visa is expiring. Pay the renewal fee immediately or you will be deported.",
        "expected_intent": "scam",
        "min_confidence": 0.75,
        "description": "Visa/deportation threat"
    },
    {
        "id": "scam_014",
        "message": "Investment opportunity: Guaranteed 20% monthly returns. You must decide and transfer at least $10,000 now.",
        "expected_intent": "scam",
        "min_confidence": 0.70,
        "description": "Investment scam with unrealistic returns"
    },
    {
        "id": "scam_015",
        "message": "Hi, this is your grandson. I'm in an emergency and need money urgently. Please transfer immediately.",
        "expected_intent": "scam",
        "min_confidence": 0.75,
        "description": "Family member impersonation scam"
    }
]
