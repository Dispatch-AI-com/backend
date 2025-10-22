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


def get_opportunity_definition() -> Dict[str, Any]:
    """Get OPPORTUNITY intent definition

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "opportunity",
        "description": "Legitimate opportunities for students including interviews, jobs, research positions, and academic engagements",
        "characteristics": [
            "Mentions of job interviews or interview invitations",
            "Employment opportunities or job offers",
            "Research opportunities or academic collaborations",
            "Internship positions or traineeships",
            "Networking events or professional meetups",
            "Career fairs or recruitment events",
            "Scholarship or fellowship opportunities",
            "Requests for availability to schedule important meetings",
            "Legitimate requests for contact information to follow up on opportunities",
            "Questions about student's skills, qualifications, or experience",
            "Offers of mentorship or professional guidance"
        ],
        "positive_examples": [
            "We'd like to invite you for a job interview next week. When are you available?",
            "Our company has an internship position available. Are you interested?",
            "I'm a professor looking for research assistants. Would you like to discuss this opportunity?",
            "There's a career fair on campus next Friday. Can we schedule a time to meet?",
            "We received your application and would like to schedule an interview.",
            "Our startup is hiring international students. Can we send you more information?",
            "I'm organizing a networking event for tech professionals. Would you like to attend?",
            "We have a scholarship opportunity for international students.",
            "Our lab is looking for graduate research assistants. Can we set up a meeting?",
            "There's an internship opening in our marketing department.",
            "We're hosting a workshop on career development. Would you like to join?",
            "I'd like to discuss a potential research collaboration. What's your email address?"
        ],
        "negative_examples": [
            "Transfer money immediately for a job offer",
            "You won a lottery prize, pay processing fee",
            "What are your office hours?",
            "I'd like to leave a message",
            "Can someone call me back?",
            "Send your bank details for salary advance"
        ],
        "keywords": [
            "interview", "job interview", "employment", "job opportunity", "job offer",
            "hiring", "recruitment", "recruiting", "career", "internship", "intern position",
            "research opportunity", "research assistant", "RA position", "PhD opportunity",
            "scholarship", "fellowship", "grant", "mentorship", "mentor",
            "networking event", "career fair", "job fair", "recruitment event",
            "workshop", "seminar", "conference", "presentation", "collaboration",
            "research collaboration", "academic opportunity", "professional development",
            "available", "availability", "when are you free", "schedule meeting",
            "send information", "contact information", "email address",
            "skills", "qualifications", "experience", "CV", "resume",
            "interested", "apply", "position available", "opening", "vacancy"
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
            "Requests that don't fit standard questions or opportunities",
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
            "We'd like to invite you for a job interview",
            "Transfer money immediately",
            "Our company has an internship position available",
            "I'm looking for research assistants",
            "You have unpaid taxes, pay immediately"
        ],
        "keywords": [
            "leave message", "callback", "call back", "special case",
            "complex", "individual attention", "personal", "discuss",
            "consultation", "unique situation", "exception", "complaint",
            "not standard", "busy", "later", "follow up",
            "speak with someone", "detailed", "complicated"
        ]
    }
