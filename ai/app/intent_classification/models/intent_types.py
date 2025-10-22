"""
Intent Type Enumeration

Defines the three intent types for classification:
- SCAM: Fraud attempts, malicious callers
- FAQ: Simple common questions answerable by FAQ system
- OTHER: Complex issues, messages, unclear intents requiring human handling
"""

from enum import Enum


class IntentType(str, Enum):
    """Intent type enumeration"""
    SCAM = "scam"
    FAQ = "faq"
    OTHER = "other"
