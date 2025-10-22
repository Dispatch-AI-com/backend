"""
Intent Classification Module

Standalone module for classifying user intents in student service conversations.

Intents:
- SCAM: Fraud attempts, malicious callers
- OPPORTUNITY: Legitimate job/research/academic opportunities for students
- OTHER: Complex issues, messages, unclear intents requiring human handling

Usage:
    from intent_classification import IntentClassifier, IntentType

    classifier = IntentClassifier()
    result = await classifier.classify_intent("We have a job interview for you")
"""

from .models.intent_types import IntentType
from .models.requests import IntentClassificationRequest
from .models.responses import IntentClassificationResponse
from .services.classifier import IntentClassifier
from .definitions.intent_definitions import (
    get_scam_definition,
    get_opportunity_definition,
    get_other_definition
)

__version__ = "2.0.0"

__all__ = [
    "IntentType",
    "IntentClassificationRequest",
    "IntentClassificationResponse",
    "IntentClassifier",
    "get_scam_definition",
    "get_opportunity_definition",
    "get_other_definition",
]
