# Intent Classification Module

Standalone module for classifying user intents in international student service conversations.

## Overview

This module provides a complete intent classification system that categorizes caller intents into three types:

- **SCAM**: Fraud attempts, malicious callers → Terminate call immediately
- **OPPORTUNITY**: Legitimate chances for students (interviews, jobs, research) → Collect student info to help them seize opportunities
- **OTHER**: Complex issues, messages, unclear intents → Human review

## Quick Start

```python
from intent_classification import IntentClassifier

classifier = IntentClassifier()
result = await classifier.classify_intent("We'd like to invite you for a job interview. When are you available?")

# Result:
# {
#   "intent": "opportunity",
#   "confidence": 0.92,
#   "reasoning": "Legitimate job interview invitation requesting student availability",
#   "metadata": {
#     "matched_keywords": ["job interview", "available", "invite"],
#     "matched_characteristics": ["Mentions of job interviews or interview invitations"]
#   }
# }
```

## Module Structure

```
intent_classification/
├── README.md                       # This file
├── __init__.py                     # Module exports
│
├── definitions/                    # Intent definitions
│   ├── __init__.py
│   ├── scam.md                     # SCAM intent documentation
│   ├── opportunity.md              # OPPORTUNITY intent documentation
│   ├── other.md                    # OTHER intent documentation
│   └── intent_definitions.py       # Python definition data structures
│
├── models/                         # Data models
│   ├── __init__.py
│   ├── intent_types.py             # IntentType enum
│   ├── requests.py                 # Request models
│   └── responses.py                # Response models
│
├── services/                       # Classification logic
│   ├── __init__.py
│   ├── classifier.py               # Main classifier
│   └── prompts.py                  # LLM system prompts
│
├── tests/                          # Test suite
│   ├── __init__.py
│   ├── test_data/                  # Test data organized by intent
│   │   ├── __init__.py
│   │   ├── scam_cases.py           # 15 SCAM test cases
│   │   ├── opportunity_cases.py    # 15 OPPORTUNITY test cases
│   │   ├── other_cases.py          # 15 OTHER test cases
│   │   └── edge_cases.py           # 5 edge cases
│   │
│   ├── test_classifier.py          # Unit tests
│   └── test_api.py                 # API tests
│
└── api/                            # API endpoints
    ├── __init__.py
    └── routes.py                   # FastAPI routes
```

## Intent Types

### 1. SCAM

**Purpose**: Detect and terminate fraud attempts

**Characteristics**:
- Requests for money transfers or immediate payments
- Impersonating government agencies, banks, or authorities
- Threatening or intimidating language
- Requesting sensitive information (bank details, passwords)
- High-pressure tactics

**Examples**:
- "This is the Tax Office. You have unpaid taxes and must pay immediately..."
- "Your bank account has been frozen. Provide your password..."

**Action**: Terminate call immediately, log incident

[Full documentation](./definitions/scam.md)

### 2. OPPORTUNITY

**Purpose**: Capture legitimate chances for students (interviews, jobs, research, internships)

**Characteristics**:
- Job interviews or interview invitations
- Employment opportunities or job offers
- Research opportunities or academic collaborations
- Internship positions or traineeships
- Networking events or professional development
- Scholarship or fellowship opportunities
- Requests for student availability or contact information

**Examples**:
- "We'd like to invite you for a job interview. When are you available?"
- "Our company has an internship position available."
- "I'm a professor looking for research assistants."
- "There's a career fair on campus. Can we schedule a meeting?"

**Action**: Collect student availability, email, contact details to help them seize opportunities

**Important**: OPPORTUNITY distinguishes from SCAM by never requesting money/payments upfront

[Full documentation](./definitions/opportunity.md)

### 3. OTHER

**Purpose**: Catch-all for complex cases requiring human handling

**Characteristics**:
- Message leaving or callback requests
- Complex or unique situations
- Complaints or disputes
- Unclear or ambiguous intents
- Special circumstances

**Examples**:
- "I'd like to leave a message"
- "Can someone call me back later?"
- "I have a complex visa situation..."

**Action**: Preserve call summary, queue for human review

[Full documentation](./definitions/other.md)

## API Endpoints

### POST /api/ai/intent/classify

Classify user intent from a message.

**Request**:
```json
{
  "currentMessage": "We have an internship position available for you.",
  "callSid": "CA123...",  // Optional
  "messages": [...]       // Optional conversation history
}
```

**Response**:
```json
{
  "intent": "opportunity",
  "confidence": 0.88,
  "reasoning": "Legitimate internship opportunity being offered to student",
  "metadata": {
    "matched_keywords": ["internship", "position", "available"],
    "matched_characteristics": ["Internship positions or traineeships"]
  }
}
```

### GET /api/ai/intent/definitions

Get all intent definitions with characteristics, examples, and keywords.

### POST /api/ai/intent/test

Run the classifier against all test cases (50 total) and get accuracy metrics.

### GET /api/ai/intent/health

Health check endpoint for the service.

## Usage Examples

### Basic Classification

```python
from intent_classification import IntentClassifier, IntentType

classifier = IntentClassifier()

# Classify a message
result = await classifier.classify_intent("We have a job interview for you next week")

if result["intent"] == IntentType.OPPORTUNITY.value:
    # Collect student info (availability, email, etc.)
    collect_student_info(result)
elif result["intent"] == IntentType.SCAM.value:
    # Terminate call
    terminate_call()
elif result["intent"] == IntentType.OTHER.value:
    # Queue for human review
    queue_for_review(result)
```

### With Conversation History

```python
# Provide conversation context
result = await classifier.classify_intent(
    current_message="Can you help me?",
    message_history=[
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello! How can I help you?"}
    ]
)
```

### Access Intent Definitions

```python
from intent_classification import (
    get_scam_definition,
    get_opportunity_definition,
    get_other_definition
)

opportunity_def = get_opportunity_definition()
print(opportunity_def["characteristics"])
print(opportunity_def["positive_examples"])
print(opportunity_def["keywords"])
```

## Classification Approach

The module uses a **conservative classification approach**:

1. **SCAM detection** is high priority - clear fraud indicators lead to immediate termination
2. **OPPORTUNITY** captures legitimate chances for students (interviews, jobs, research)
3. **OTHER** is the default fallback - when in doubt, route to human review

**Decision Tree**:
```
Is it clearly a fraud attempt?
├─ Yes → SCAM
└─ No → Continue

Is it a legitimate opportunity (interview, job, research)?
├─ Yes → OPPORTUNITY
└─ No → Continue

Is it complex, personalized, or unclear?
├─ Yes → OTHER
└─ Unsure → OTHER (default)
```

## Test Data

The module includes 50 test cases:
- **15 SCAM cases**: Various fraud scenarios
- **15 OPPORTUNITY cases**: Job interviews, research positions, internships, networking
- **15 OTHER cases**: Complex situations, messages, callbacks
- **5 Edge cases**: Ambiguous situations testing boundaries

Run tests via API:
```bash
curl -X POST http://localhost:8000/api/ai/intent/test
```

## Configuration

The classifier uses OpenAI GPT models. Configure via environment variables:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo
```

## Development

### Adding New Test Cases

Add test cases to the appropriate file in `tests/test_data/`:

```python
# tests/test_data/opportunity_cases.py
OPPORTUNITY_TEST_CASES.append({
    "id": "opportunity_016",
    "message": "We're offering a research fellowship. Can we discuss?",
    "expected_intent": "opportunity",
    "min_confidence": 0.85,
    "description": "Research fellowship offer"
})
```

### Modifying Intent Definitions

1. Update the markdown file in `definitions/` (for documentation)
2. Update the corresponding function in `definitions/intent_definitions.py` (for code)
3. Update system prompts in `services/prompts.py` if needed

### Running Tests

```python
# Test specific intent
from intent_classification.tests.test_data import OPPORTUNITY_TEST_CASES
from intent_classification import intent_classifier

for test_case in OPPORTUNITY_TEST_CASES:
    result = await intent_classifier.classify_intent(test_case["message"])
    print(f"{test_case['id']}: {result['intent']} (confidence: {result['confidence']})")
```

## Best Practices

1. **Always provide context**: Include conversation history when available for better accuracy
2. **Monitor confidence scores**: Low confidence (<0.7) may indicate ambiguous cases
3. **Review OTHER cases**: Regularly review messages classified as OTHER to identify patterns
4. **Update definitions**: Refine intent definitions based on real-world usage
5. **Test regularly**: Run the test suite after any changes to definitions or prompts

## Integration

### With existing AI module

```python
# In your main FastAPI app
from intent_classification.api import router as intent_router

app.include_router(intent_router, prefix="/api/ai")
```

### Standalone usage

```python
from intent_classification import (
    IntentClassifier,
    IntentType,
    IntentClassificationRequest,
    IntentClassificationResponse
)

# Use as needed
classifier = IntentClassifier()
result = await classifier.classify_intent("Your message here")
```

## Troubleshooting

### Low accuracy
- Check if intent definitions match your use case
- Review failed test cases to identify patterns
- Adjust confidence thresholds in test data
- Refine system prompts

### Import errors
- Ensure module is in Python path
- Check all `__init__.py` files are present
- Verify dependencies are installed

### API errors
- Check OpenAI API key is set
- Verify OpenAI model is available
- Check request format matches examples

## License

Internal use only. Part of Dispatch AI backend system.

## Support

For questions or issues with this module, please contact the development team.
