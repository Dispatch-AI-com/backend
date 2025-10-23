"""
Intent Definitions Module

Contains intent definitions in both markdown format (for documentation)
and Python format (for programmatic access).
"""

from .intent_definitions import (
    get_scam_definition,
    get_opportunity_definition,
    get_other_definition
)

__all__ = [
    "get_scam_definition",
    "get_opportunity_definition",
    "get_other_definition",
]
