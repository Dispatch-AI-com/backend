"""
Intent Classification Test Data

Test cases for validating intent classification accuracy.
"""

from .scam_cases import SCAM_TEST_CASES
from .faq_cases import FAQ_TEST_CASES
from .other_cases import OTHER_TEST_CASES
from .edge_cases import EDGE_CASE_TEST_CASES

ALL_TEST_CASES = {
    "scam": SCAM_TEST_CASES,
    "faq": FAQ_TEST_CASES,
    "other": OTHER_TEST_CASES,
    "edge_cases": EDGE_CASE_TEST_CASES
}

__all__ = [
    "SCAM_TEST_CASES",
    "FAQ_TEST_CASES",
    "OTHER_TEST_CASES",
    "EDGE_CASE_TEST_CASES",
    "ALL_TEST_CASES",
]
