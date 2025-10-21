"""
Intent Classification Prompts Module

This module contains intent definition templates and system prompts
for classifying user intents in student service conversations.

Intent Types:
- SCAM_CALL: Scam calls or malicious callers
- INQUIRY: Student questions and inquiries (will link to FAQ)
- LEAVE_MESSAGE: User wants to leave a message (NOT human transfer)
"""


def get_scam_call_definition():
    """Scam call definition template

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "scam_call",
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
            "I'd like to inquire about course enrollment",
            "What are your office hours?",
            "Can I leave a message?",
            "I have a question about my student account",
            "I need help with registration"
        ],
        "keywords": [
            "tax office", "ATO", "police", "arrest", "fine", "transfer money",
            "bank account", "password", "urgent", "immediate payment", "account frozen",
            "lottery", "won prize", "customs", "Medicare", "Centrelink",
            "gift card", "iTunes card", "threat", "lawsuit", "court",
            "fraud", "scam", "suspicious", "verify identity"
        ]
    }


def get_inquiry_definition():
    """Inquiry definition template for student questions

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "inquiry",
        "description": "Student questions and inquiries about services, courses, or campus information",
        "characteristics": [
            "Asking about course details, schedules, or requirements",
            "Inquiring about office hours or contact information",
            "Questions about enrollment, registration, or deadlines",
            "Asking about campus facilities or services",
            "Questions about fees, payments, or financial aid",
            "Seeking clarification on policies or procedures",
            "Asking about events, activities, or programs",
            "General information requests about the institution"
        ],
        "positive_examples": [
            "What are the prerequisites for the computer science course?",
            "When is the enrollment deadline for next semester?",
            "What are your office hours?",
            "How much are the tuition fees for international students?",
            "Where can I find information about campus housing?",
            "What documents do I need for registration?",
            "Are there any scholarships available?",
            "Can you tell me about the student exchange program?",
            "What time does the library close on weekends?",
            "How do I apply for financial aid?",
            "What's the refund policy for course withdrawals?",
            "Is there a career counseling service available?"
        ],
        "negative_examples": [
            "I want to leave a message",
            "Transfer money immediately or face arrest",
            "Your account is frozen",
            "I'm not available right now, can someone call me back?",
            "Can I speak to someone in person?"
        ],
        "keywords": [
            "course", "class", "enrollment", "registration", "deadline",
            "tuition", "fees", "payment", "scholarship", "financial aid",
            "office hours", "contact", "information", "when", "where",
            "how", "what", "schedule", "requirement", "prerequisite",
            "campus", "facility", "service", "library", "help",
            "question", "inquire", "ask", "clarify", "explain"
        ]
    }


def get_leave_message_definition():
    """Leave message definition template (NOT human transfer)

    Returns:
        dict: Intent definition with characteristics, examples, and keywords
    """
    return {
        "name": "leave_message",
        "description": "User wants to leave a message for callback (not requesting human transfer)",
        "characteristics": [
            "Explicitly states wanting to leave a message",
            "Requests a callback at a later time",
            "Indicates they are currently unavailable",
            "Wants to provide information for someone to review",
            "Asks for someone to contact them back",
            "States they cannot talk right now",
            "Prefers asynchronous communication"
        ],
        "positive_examples": [
            "I'd like to leave a message",
            "Can someone call me back later?",
            "I'm busy right now, can I leave a message?",
            "Please have someone contact me when they're available",
            "I can't talk now, but I need to leave some information",
            "Could you take a message for me?",
            "I'll leave my details and someone can call me back",
            "I'm driving right now, can I leave a message instead?",
            "Just take down my information and I'll wait for a callback",
            "I need to leave a voicemail",
            "Can you record this message for me?"
        ],
        "negative_examples": [
            "What are your course offerings?",
            "Transfer money immediately",
            "How much does enrollment cost?",
            "I want to book an appointment",
            "What time do you open?"
        ],
        "keywords": [
            "leave message", "callback", "call back", "contact me",
            "unavailable", "busy", "can't talk", "later",
            "voicemail", "record", "take down", "information",
            "get back to me", "return call", "message", "not available"
        ]
    }


def get_intent_classification_system_prompt():
    """Main system prompt for intent classification

    Returns:
        str: Complete system prompt for intent classification
    """
    scam_def = get_scam_call_definition()
    inquiry_def = get_inquiry_definition()
    message_def = get_leave_message_definition()

    return f"""You are an intent classification system for a student services AI assistant.
Analyze the conversation and classify the caller's intent into one of three categories.

CONTEXT: The callers are students who may have questions about courses, campus services, or want to leave messages.

INTENT DEFINITIONS:

1. SCAM_CALL - {scam_def['description']}
Characteristics:
{chr(10).join(f'- {c}' for c in scam_def['characteristics'])}

Positive Examples (SHOULD be classified as SCAM_CALL):
{chr(10).join(f'- "{e}"' for e in scam_def['positive_examples'])}

Negative Examples (should NOT be classified as SCAM_CALL):
{chr(10).join(f'- "{e}"' for e in scam_def['negative_examples'])}

Key Indicators: {', '.join(scam_def['keywords'][:15])}


2. INQUIRY - {inquiry_def['description']}
NOTE: These inquiries will be routed to an FAQ system (separate feature, not part of this API).

Characteristics:
{chr(10).join(f'- {c}' for c in inquiry_def['characteristics'])}

Positive Examples (SHOULD be classified as INQUIRY):
{chr(10).join(f'- "{e}"' for e in inquiry_def['positive_examples'])}

Negative Examples (should NOT be classified as INQUIRY):
{chr(10).join(f'- "{e}"' for e in inquiry_def['negative_examples'])}

Key Indicators: {', '.join(inquiry_def['keywords'][:15])}


3. LEAVE_MESSAGE - {message_def['description']}
IMPORTANT: This is for leaving messages only, NOT for transferring to human agents.

Characteristics:
{chr(10).join(f'- {c}' for c in message_def['characteristics'])}

Positive Examples (SHOULD be classified as LEAVE_MESSAGE):
{chr(10).join(f'- "{e}"' for e in message_def['positive_examples'])}

Negative Examples (should NOT be classified as LEAVE_MESSAGE):
{chr(10).join(f'- "{e}"' for e in message_def['negative_examples'])}

Key Indicators: {', '.join(message_def['keywords'][:15])}


CLASSIFICATION RULES:
1. Analyze the user's message and conversation context carefully
2. Match against characteristics and keywords for each intent type
3. Assign confidence score based on match strength (0.0 - 1.0)
4. Provide clear reasoning for the classification decision
5. Include matched keywords and characteristics in metadata
6. Remember: Inquiries will link to FAQ, not human agents
7. Leave message is for callbacks only, not human transfer requests

RESPONSE FORMAT:
Respond ONLY with JSON in this exact format (no markdown, no code blocks):
{{
  "intent": "scam_call" | "inquiry" | "leave_message",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification decision (1-2 sentences)",
  "metadata": {{
    "matched_keywords": ["list", "of", "matched", "keywords"],
    "matched_characteristics": ["list", "of", "matched", "characteristics"]
  }}
}}

IMPORTANT: Output ONLY the JSON object, nothing else."""
