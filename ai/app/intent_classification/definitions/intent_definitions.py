"""
Intent Definition Data Structures

Provides structured access to intent definitions.
Definitions are maintained in markdown files for documentation,
and this module provides programmatic access to the data.
"""

from typing import Dict, Any


def get_scam_definition() -> Dict[str, Any]:
    """Get SCAM intent definition

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "scam",
        "description": "Scam calls or malicious callers attempting fraud",
        "characteristics": [
            "Requests for money transfers or payments (non-service related)",
            "Impersonating government agencies, banks, or tax offices",
            "Using threatening or intimidating language",
            "Requesting sensitive information (bank account, password, credit card)",
            "Claims of urgent situations requiring immediate action",
            "Mentions of legal action, arrest, fines, or penalties",
            "Claims that accounts are frozen or compromised",
            "Requests to purchase gift cards or prepaid cards",
            "High-pressure sales tactics or threats"
        ],
        "positive_examples": [
            "This is the Australian Tax Office. You have unpaid taxes and must pay immediately or face prosecution.",
            "Your bank account has been frozen. Please provide your account number and password to unlock it.",
            "This is the police department. You are suspected of money laundering and must transfer bail money immediately.",
            "Congratulations, you've won the lottery! But you need to pay processing fees first to claim your prize.",
            "Your parcel has been seized by customs. You must pay a fine immediately or it will be destroyed.",
            "This is Medicare. Your account has suspicious activity. Please provide your bank details immediately.",
            "Your internet will be disconnected in 24 hours. Call this number to make immediate payment.",
            "I'm your grandson. I'm in trouble and need money urgently. Please transfer immediately."
        ],
        "negative_examples": [
            "What are your office hours?",
            "I'd like to leave a message",
            "I have a question about my enrollment",
            "Can someone call me back?",
            "I need help with my application"
        ],
        "keywords": [
            "tax office", "ATO", "police", "arrest", "fine", "transfer money",
            "bank account", "password", "urgent", "immediate payment", "account frozen",
            "lottery", "won prize", "customs", "Medicare", "Centrelink",
            "gift card", "iTunes card", "threat", "lawsuit", "court",
            "fraud", "scam", "suspicious", "verify identity"
        ]
    }


def get_faq_definition() -> Dict[str, Any]:
    """Get FAQ intent definition

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "faq",
        "description": "Common student questions that can be answered by FAQ system",
        "characteristics": [
            "Asking about office hours or availability",
            "Inquiring about enrollment deadlines or application dates",
            "Questions about tuition fees or payment schedules",
            "Asking about campus location or contact information",
            "Questions about general services offered",
            "Inquiring about operating hours or schedules",
            "Simple factual questions with standard answers",
            "Questions about visa requirements or documentation"
        ],
        "positive_examples": [
            "What are your office hours?",
            "When is the enrollment deadline for next semester?",
            "How much are the tuition fees for international students?",
            "What time do you open/close?",
            "Where is your office located?",
            "What's your phone number?",
            "Do you have weekend hours?",
            "What documents do I need for enrollment?",
            "What services do you provide?",
            "What are the application deadlines?",
            "Do you accept international students?",
            "What's your email address?"
        ],
        "negative_examples": [
            "I want to leave a message",
            "Transfer money immediately or face arrest",
            "I have a complex immigration issue that needs discussion",
            "I'm not available right now, can someone call me back?",
            "This is regarding a special case that needs individual attention"
        ],
        "keywords": [
            "office hours", "opening hours", "deadline", "when", "what time",
            "tuition", "fees", "how much", "location", "address",
            "phone number", "email", "contact", "services", "what",
            "enrollment", "application", "requirements", "documents",
            "weekend", "schedule", "available", "international students"
        ]
    }


def get_other_definition() -> Dict[str, Any]:
    """Get OTHER intent definition

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "other",
        "description": "Unrecognized intents requiring human handling (complex issues, messages, unclear requests)",
        "characteristics": [
            "Complex or unique situations requiring individual attention",
            "Requests that don't fit FAQ or standard questions",
            "Wanting to leave a message or callback request",
            "Unclear or ambiguous intent",
            "Personal circumstances requiring case-by-case handling",
            "Complaints or disputes",
            "Special requests or exceptions",
            "Currently unavailable and needs human follow-up"
        ],
        "positive_examples": [
            "I'd like to leave a message",
            "Can someone call me back later?",
            "I have a special situation regarding my visa that needs discussion",
            "I can't talk now, but I need to leave some information",
            "I need to speak with someone about a complex enrollment issue",
            "This is regarding a personal matter that requires individual attention",
            "I'm not satisfied with how my case was handled",
            "Can I schedule a one-on-one consultation?",
            "I have multiple questions that need detailed discussion",
            "My situation is complicated and I need personalized help"
        ],
        "negative_examples": [
            "What are your office hours?",
            "Transfer money immediately",
            "How much are tuition fees?",
            "When is the application deadline?",
            "What's your address?"
        ],
        "keywords": [
            "leave message", "callback", "call back", "special case",
            "complex", "individual attention", "personal", "discuss",
            "consultation", "unique situation", "exception", "complaint",
            "not standard", "busy", "later", "follow up",
            "speak with someone", "detailed", "complicated"
        ]
    }
