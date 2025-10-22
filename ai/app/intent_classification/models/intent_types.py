"""
Intent Type Enumeration

Defines the three intent types for classification:
- SCAM: Fraud attempts, malicious callers
- OPPORTUNITY: Legitimate job/research/academic opportunities for students
- OTHER: Complex issues, messages, unclear intents requiring human handling
"""

from enum import Enum


class IntentType(str, Enum):
    """Intent type enumeration"""
    SCAM = "scam"
    OPPORTUNITY = "opportunity"
    OTHER = "other"
