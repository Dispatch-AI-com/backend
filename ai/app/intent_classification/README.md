# Intent Classification Module

Standalone module for classifying user intents in international student service conversations with comprehensive testing and fine-tuning capabilities.

## Overview

This module provides a complete intent classification system that categorizes caller intents into three types:

- **SCAM**: Fraud attempts, malicious callers → Terminate call immediately
- **OPPORTUNITY**: Legitimate chances for students (interviews, jobs, research) → Collect student info to help them seize opportunities
- **OTHER**: Complex issues, messages, unclear intents → Human review

### Key Features

✅ **Automated Testing** with comprehensive metrics
✅ **Fine-Tuning Pipeline** for continuous improvement
✅ **Complete Documentation** with examples
✅ **FastAPI Integration** ready to use

## Quick Start

### Basic Usage

```python
from intent_classification import IntentClassifier

classifier = IntentClassifier()
result = await classifier.classify_intent("We'd like to invite you for a job interview. When are you available?")

# Result:
# {
#   "intent": "opportunity",
#   "confidence": 0.95,
#   "reasoning": "Legitimate job interview invitation requesting student availability",
#   "metadata": {
#     "matched_keywords": ["job interview", "available", "invite"],
#     "matched_characteristics": ["Mentions of job interviews or interview invitations"]
#   }
# }
```

### Run Tests

```bash
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai
./app/intent_classification/tests/run_tests.sh
```

This will:
1. Run all test cases
2. Generate performance metrics (Accuracy, Precision, Recall, F1)
3. Create confusion matrix
4. Identify misclassifications
5. Generate fine-tuning datasets

## Module Structure

```
intent_classification/
├── README.md                       # This file
├── __init__.py                     # Module exports (v2.0.0)
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
│   ├── intent_types.py             # IntentType enum (SCAM, OPPORTUNITY, OTHER)
│   ├── requests.py                 # Request models
│   └── responses.py                # Response models
│
├── services/                       # Classification logic
│   ├── __init__.py
│   ├── classifier.py               # Main classifier with OpenAI integration
│   └── prompts.py                  # LLM system prompts
│
├── tests/                          # Testing & Fine-Tuning Suite ⭐ NEW
│   ├── __init__.py
│   ├── test_runner.py              # Automated test runner with metrics
│   ├── fine_tuning.py              # Fine-tuning data generator
│   ├── demo.py                     # Quick demonstration script
│   ├── run_tests.sh                # Convenience script
│   ├── README.md                   # Complete testing documentation
│   ├── QUICK_START.md              # Quick reference guide
│   ├── TESTING_SUMMARY.md          # System overview
│   │
│   ├── test_data/                  # Test cases organized by intent
│   │   ├── __init__.py
│   │   ├── scam_cases.py           # 15 SCAM test cases
│   │   ├── opportunity_cases.py    # 15 OPPORTUNITY test cases
│   │   ├── other_cases.py          # 15 OTHER test cases
│   │   └── edge_cases.py           # 5 edge cases
│   │
│   ├── results/                    # Test results (auto-generated)
│   │   ├── metrics_*.json          # Performance metrics
│   │   ├── report_*.txt            # Human-readable reports
│   │   └── misclassified_*.json    # Failed cases for analysis
│   │
│   └── fine_tuning_data/           # Fine-tuning datasets (auto-generated)
│       ├── train_*.jsonl           # Training data (OpenAI format)
│       └── validation_*.jsonl      # Validation data
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
  "confidence": 0.95,
  "reasoning": "Legitimate internship opportunity being offered to student",
  "metadata": {
    "matched_keywords": ["internship", "position", "available"],
    "matched_characteristics": ["Internship positions or traineeships"]
  }
}
```

### GET /api/ai/intent/definitions

Get all intent definitions with characteristics, examples, and keywords.

**Response**:
```json
{
  "scam": { "name": "scam", "description": "...", ... },
  "opportunity": { "name": "opportunity", "description": "...", ... },
  "other": { "name": "other", "description": "...", ... }
}
```

### POST /api/ai/intent/test

Run the classifier against all test cases and get accuracy metrics.

**Response**:
```json
{
  "total_tests": <number>,
  "passed": <number>,
  "failed": <number>,
  "accuracy": <float>,
  "by_intent": {
    "scam": {"tests": <number>, "passed": <number>, "accuracy": <float>},
    "opportunity": {"tests": <number>, "passed": <number>, "accuracy": <float>},
    "other": {"tests": <number>, "passed": <number>, "accuracy": <float>}
  }
}
```

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
# Provide conversation context for better accuracy
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
print(opportunity_def["name"])                # "opportunity"
print(opportunity_def["characteristics"])     # List of characteristics
print(opportunity_def["positive_examples"])   # Example messages
print(opportunity_def["keywords"])            # List of keywords
```

### Programmatic Testing

```python
from intent_classification.tests.test_runner import IntentTestRunner

runner = IntentTestRunner()
metrics = await runner.run_all_tests()

print(f"Accuracy: {metrics['summary']['accuracy']:.1%}")
print(f"F1 Score: {metrics['summary']['macro_f1']:.1%}")

# Access per-intent metrics
scam_metrics = metrics['per_intent']['scam']
print(f"SCAM Recall: {scam_metrics['recall']:.1%}")
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

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_api_key

# Optional (defaults shown)
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2500
OPENAI_TEMPERATURE=0.0
```

### Model Configuration

The classifier uses OpenAI GPT models with:
- **Temperature**: 0.3 (for consistent classification)
- **Max Tokens**: 500
- **Response Format**: JSON mode
- **Model**: gpt-4o-mini (default) or fine-tuned variant

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

After adding cases, run tests to validate:

```bash
./app/intent_classification/tests/run_tests.sh
```

### Modifying Intent Definitions

To update intent definitions:

1. Update markdown file in `definitions/` (for documentation)
2. Update corresponding function in `definitions/intent_definitions.py`
3. Update system prompts in `services/prompts.py` if needed
4. Run tests to validate changes

```bash
# After changes
./app/intent_classification/tests/run_tests.sh

# Check accuracy hasn't degraded
cat app/intent_classification/tests/results/report_*.txt
```

### Running Tests Programmatically

```python
# Test specific intent
from intent_classification.tests.test_data import OPPORTUNITY_TEST_CASES
from intent_classification import intent_classifier

for test_case in OPPORTUNITY_TEST_CASES:
    result = await intent_classifier.classify_intent(test_case["message"])
    is_correct = result["intent"] == test_case["expected_intent"]
    print(f"{test_case['id']}: {'✅' if is_correct else '❌'} {result['intent']}")
```

## Best Practices

1. **Always provide context**: Include conversation history when available for better accuracy
2. **Monitor confidence scores**: Low confidence (<0.7) may indicate ambiguous cases
3. **Review OTHER cases**: Regularly review messages classified as OTHER to identify patterns
4. **Update definitions**: Refine intent definitions based on real-world usage
5. **Test regularly**: Run the test suite after any changes to definitions or prompts
6. **Track metrics**: Monitor accuracy, precision, and recall in production
7. **Fine-tune when needed**: If accuracy drops below 95%, consider fine-tuning

## Integration

### With FastAPI Application

```python
# In main.py
from intent_classification.api import router as intent_router

app.include_router(intent_router, prefix="/api/ai")
```

### Standalone Usage

```python
from intent_classification import (
    IntentClassifier,
    IntentType,
    IntentClassificationRequest,
    IntentClassificationResponse
)

# Initialize classifier
classifier = IntentClassifier()

# Classify message
result = await classifier.classify_intent("Your message here")

# Access result
intent = result["intent"]
confidence = result["confidence"]
```

## Performance Monitoring

### Key Metrics to Track

| Metric | Excellent | Good | Needs Attention |
|--------|-----------|------|-----------------|
| **Overall Accuracy** | > 95% | 90-95% | < 90% |
| **SCAM Recall** | 100% | 95-99% | < 95% ⚠️ |
| **OPPORTUNITY Precision** | > 90% | 85-90% | < 85% |
| **F1 Score (all intents)** | > 0.90 | 0.85-0.90 | < 0.85 |

**Critical**: SCAM recall < 95% is dangerous - means missing fraud attempts!

### When to Fine-Tune

Consider fine-tuning if:
- Overall accuracy drops below 90%
- SCAM recall falls below 95%
- OPPORTUNITY precision falls below 85%
- High number of misclassifications in production
- New types of messages appear frequently

## Troubleshooting

### Low Accuracy

**Symptoms**: Test accuracy < 90%

**Solutions**:
1. Review failed test cases in `tests/results/misclassified_*.json`
2. Check intent definitions for clarity
3. Update system prompts with better examples
4. Generate fine-tuning data and train model
5. Add more test cases for weak areas

### High False Positive Rate (SCAM)

**Symptoms**: Non-scam messages classified as SCAM

**Solutions**:
1. Review SCAM definition for over-broad keywords
2. Add negative examples to SCAM definition
3. Increase confidence threshold for SCAM classification
4. Fine-tune with correction examples

### Missing Opportunities

**Symptoms**: OPPORTUNITY messages classified as OTHER

**Solutions**:
1. Expand OPPORTUNITY keywords list
2. Add more positive examples
3. Review OTHER vs OPPORTUNITY boundary cases
4. Fine-tune with OPPORTUNITY emphasis

### Import Errors

**Symptoms**: `ModuleNotFoundError` or import failures

**Solutions**:
```bash
# Ensure in correct directory
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai

# Check Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/app"

# Verify dependencies
uv sync
```

### API Errors

**Symptoms**: OpenAI API failures

**Solutions**:
1. Check API key: `echo $OPENAI_API_KEY`
2. Verify model availability
3. Check rate limits
4. Review error logs in test results

## Documentation

### Main Documentation
- **This file**: Module overview and API reference
- `tests/README.md`: Complete testing guide
- `tests/QUICK_START.md`: Quick reference
- `tests/TESTING_SUMMARY.md`: System overview

### Intent Definitions
- `definitions/scam.md`: SCAM intent documentation
- `definitions/opportunity.md`: OPPORTUNITY intent documentation
- `definitions/other.md`: OTHER intent documentation

### Test Results
- `tests/results/report_*.txt`: Human-readable test reports
- `tests/results/metrics_*.json`: Detailed metrics in JSON
- `tests/results/misclassified_*.json`: Failed cases for analysis

## License

Internal use only. Part of Dispatch AI backend system.

## Support

### For Testing Issues
See `tests/README.md` for detailed testing documentation.

### For Integration Issues
Contact the development team.

### For Performance Issues
1. Run tests: `./app/intent_classification/tests/run_tests.sh`
2. Review metrics in `tests/results/`
3. Check logs for errors
4. Contact development team with test results

---

**Status**: 🔧 In Development
**Version**: 2.0.0
**Last Updated**: 2025-10-22
