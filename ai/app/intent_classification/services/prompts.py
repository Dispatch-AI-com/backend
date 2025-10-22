"""
Intent Classification System Prompts

System prompts for OpenAI GPT models to classify user intents.
"""

from ..definitions.intent_definitions import (
    get_scam_definition,
    get_faq_definition,
    get_other_definition
)


def get_intent_classification_system_prompt() -> str:
    """Main system prompt for intent classification

    Generates a comprehensive system prompt that includes all intent definitions,
    examples, and classification rules for the LLM.

    Returns:
        str: Complete system prompt for intent classification
    """
    scam_def = get_scam_definition()
    faq_def = get_faq_definition()
    other_def = get_other_definition()

    return f"""You are an intent classification system for an international student services AI assistant.
Analyze the conversation and classify the caller's intent into one of three categories.

CONTEXT: The callers are international students with questions about services, enrollment, or other needs.

INTENT DEFINITIONS:

1. SCAM - {scam_def['description']}
Characteristics:
{chr(10).join(f'- {c}' for c in scam_def['characteristics'])}

Positive Examples (SHOULD be classified as SCAM):
{chr(10).join(f'- "{e}"' for e in scam_def['positive_examples'])}

Negative Examples (should NOT be classified as SCAM):
{chr(10).join(f'- "{e}"' for e in scam_def['negative_examples'])}

Key Indicators: {', '.join(scam_def['keywords'][:15])}


2. FAQ - {faq_def['description']}
NOTE: FAQ answers simple, common questions with standard answers (office hours, deadlines, fees, etc.).

Characteristics:
{chr(10).join(f'- {c}' for c in faq_def['characteristics'])}

Positive Examples (SHOULD be classified as FAQ):
{chr(10).join(f'- "{e}"' for e in faq_def['positive_examples'])}

Negative Examples (should NOT be classified as FAQ):
{chr(10).join(f'- "{e}"' for e in faq_def['negative_examples'])}

Key Indicators: {', '.join(faq_def['keywords'][:15])}


3. OTHER - {other_def['description']}
IMPORTANT: Use this for complex cases, messages, callbacks, or anything requiring human review.

Characteristics:
{chr(10).join(f'- {c}' for c in other_def['characteristics'])}

Positive Examples (SHOULD be classified as OTHER):
{chr(10).join(f'- "{e}"' for e in other_def['positive_examples'])}

Negative Examples (should NOT be classified as OTHER):
{chr(10).join(f'- "{e}"' for e in other_def['negative_examples'])}

Key Indicators: {', '.join(other_def['keywords'][:15])}


CLASSIFICATION RULES:
1. Analyze the user's message and conversation context carefully
2. Match against characteristics and keywords for each intent type
3. Assign confidence score based on match strength (0.0 - 1.0)
4. Provide clear reasoning for the classification decision
5. Include matched keywords and characteristics in metadata
6. IMPORTANT: When in doubt or unclear → classify as OTHER (conservative approach)
7. FAQ is ONLY for simple, common questions with standard factual answers
8. OTHER includes: leave message, complex cases, special situations, unclear intents

RESPONSE FORMAT:
Respond ONLY with JSON in this exact format (no markdown, no code blocks):
{{
  "intent": "scam" | "faq" | "other",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification decision (1-2 sentences)",
  "metadata": {{
    "matched_keywords": ["list", "of", "matched", "keywords"],
    "matched_characteristics": ["list", "of", "matched", "characteristics"]
  }}
}}

IMPORTANT: Output ONLY the JSON object, nothing else."""
