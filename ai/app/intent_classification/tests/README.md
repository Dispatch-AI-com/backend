# Intent Classification Testing & Fine-Tuning

Comprehensive testing suite for the intent classification system with performance metrics and fine-tuning capabilities.

## Overview

This testing framework provides:

1. **Automated Testing** - Run all test cases and get instant feedback
2. **Performance Metrics** - Accuracy, Precision, Recall, F1 Score, Confusion Matrix
3. **Misclassification Analysis** - Identify patterns and problem areas
4. **Fine-Tuning Dataset Generation** - Automatically generate OpenAI fine-tuning data
5. **Continuous Improvement** - Iterative model refinement workflow

## Quick Start

### Run Tests

```bash
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai
.venv/bin/python app/intent_classification/tests/test_runner.py
```

This will:
- Run all 50 test cases (15 SCAM + 15 OPPORTUNITY + 15 OTHER + 5 edge cases)
- Calculate performance metrics
- Generate detailed report
- Save results to `tests/results/`

### Generate Fine-Tuning Data

```bash
# Generate from base test cases only
.venv/bin/python app/intent_classification/tests/fine_tuning.py

# Generate from test results (includes misclassifications)
.venv/bin/python app/intent_classification/tests/fine_tuning.py tests/results/metrics_YYYYMMDD_HHMMSS.json
```

This will:
- Create training and validation datasets
- Save in JSONL format for OpenAI fine-tuning
- Generate improvement analysis report

## Performance Metrics

### Metrics Calculated

#### Overall Metrics
- **Accuracy**: (TP + TN) / Total - Overall correctness
- **Macro Precision**: Average precision across all intents
- **Macro Recall**: Average recall across all intents
- **Macro F1**: Average F1 score across all intents

#### Per-Intent Metrics
For each intent (SCAM, OPPORTUNITY, OTHER):
- **Precision**: TP / (TP + FP) - How many predicted positives are correct
- **Recall**: TP / (TP + FN) - How many actual positives are found
- **F1 Score**: 2 × (Precision × Recall) / (Precision + Recall)
- **Support**: Total number of actual cases for this intent
- **Average Confidence**: Mean confidence score for predictions
- **Low Confidence Count**: Cases below minimum threshold

#### Confusion Matrix
Shows how often each intent is classified as each other intent:

```
Actual/Predicted    scam           opportunity    other
scam                13             1              1
opportunity         0              14             1
other               1              0              14
```

### Understanding Results

**Good Performance Indicators:**
- ✅ Accuracy > 90%
- ✅ F1 Score > 0.85 for all intents
- ✅ Low false positive rate for SCAM (critical!)
- ✅ High recall for OPPORTUNITY (don't miss chances!)

**Areas for Improvement:**
- ⚠️ Accuracy < 85%
- ⚠️ F1 Score < 0.75 for any intent
- ⚠️ High false positives for SCAM
- ⚠️ Low confidence scores (< 0.7)

## Test Data Structure

### Test Cases Location
```
tests/test_data/
├── scam_cases.py           # 15 fraud scenarios
├── opportunity_cases.py    # 15 job/research opportunities
├── other_cases.py          # 15 complex/message cases
└── edge_cases.py           # 5 ambiguous boundary cases
```

### Test Case Format

```python
{
    "id": "opportunity_001",
    "message": "We'd like to invite you for a job interview next week.",
    "expected_intent": "opportunity",
    "min_confidence": 0.85,
    "description": "Job interview invitation"
}
```

### Adding New Test Cases

1. Add to appropriate file in `test_data/`
2. Follow the format above
3. Set realistic `min_confidence` threshold
4. Run tests to validate

## Fine-Tuning Workflow

### 1. Initial Baseline

```bash
# Run tests to establish baseline
.venv/bin/python app/intent_classification/tests/test_runner.py
```

Review metrics and identify weak areas.

### 2. Generate Fine-Tuning Data

```bash
# Generate datasets from latest test results
.venv/bin/python app/intent_classification/tests/fine_tuning.py \
  tests/results/metrics_YYYYMMDD_HHMMSS.json
```

This creates:
- `fine_tuning_data/train_YYYYMMDD_HHMMSS.jsonl`
- `fine_tuning_data/validation_YYYYMMDD_HHMMSS.jsonl`

### 3. Upload to OpenAI

```bash
# Upload training data
openai api files.create \
  -f tests/fine_tuning_data/train_YYYYMMDD_HHMMSS.jsonl \
  -p fine-tune

# Upload validation data
openai api files.create \
  -f tests/fine_tuning_data/validation_YYYYMMDD_HHMMSS.jsonl \
  -p fine-tune
```

### 4. Create Fine-Tuning Job

```bash
openai api fine_tunes.create \
  -t file-TRAIN_FILE_ID \
  -v file-VAL_FILE_ID \
  -m gpt-3.5-turbo \
  --suffix "intent-classification"
```

### 5. Monitor Progress

```bash
# Check status
openai api fine_tunes.follow -i ft-JOB_ID

# List all jobs
openai api fine_tunes.list
```

### 6. Update Model

Once fine-tuning completes:

```python
# In config/settings.py or .env
OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:intent-classification:JOB_ID
```

### 7. Validate Improvement

```bash
# Run tests again with fine-tuned model
.venv/bin/python app/intent_classification/tests/test_runner.py
```

Compare metrics to baseline. Expected improvements:
- ✅ Higher accuracy
- ✅ Better F1 scores
- ✅ Fewer misclassifications
- ✅ Higher confidence scores

## Continuous Improvement Cycle

```
┌─────────────────┐
│  Run Tests      │
│  Get Baseline   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Analyze Results │
│ Find Patterns   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │
│ Fine-Tune Data  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Train Model     │
│ on OpenAI       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy New      │
│ Model           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate        │
│ Improvements    │
└────────┬────────┘
         │
         └─────────► Repeat
```

## Advanced Usage

### Custom Test Suites

```python
from intent_classification.tests.test_runner import IntentTestRunner

runner = IntentTestRunner()

# Run specific test suite
custom_tests = {
    "scam": SCAM_TEST_CASES,
    "opportunity": OPPORTUNITY_TEST_CASES[:5]  # First 5 only
}

metrics = await runner.run_all_tests(custom_tests)
```

### Programmatic Metrics Access

```python
from intent_classification.tests.test_runner import IntentTestRunner

runner = IntentTestRunner()
metrics = await runner.run_all_tests()

# Access specific metrics
accuracy = metrics["summary"]["accuracy"]
scam_f1 = metrics["per_intent"]["scam"]["f1_score"]
confusion = metrics["confusion_matrix"]

# Get misclassified cases
for case in metrics["misclassified_cases"]:
    print(f"Expected: {case['expected_intent']}")
    print(f"Got: {case['predicted_intent']}")
    print(f"Message: {case['message']}")
```

### Custom Fine-Tuning Data

```python
from intent_classification.tests.fine_tuning import FineTuningDataGenerator

generator = FineTuningDataGenerator()

# Create custom example
example = generator.create_training_example(
    message="We have a position available in our lab",
    intent="opportunity",
    confidence=0.95,
    reasoning="Research lab position offer"
)

# Generate from misclassifications
corrections = generator.generate_from_misclassifications(
    misclassified_cases
)

# Save
generator.save_fine_tuning_dataset(corrections, name="corrections")
```

## Output Files

### Test Results Directory

```
tests/results/
├── metrics_20251022_143000.json      # Full metrics in JSON
├── report_20251022_143000.txt        # Human-readable report
└── misclassified_20251022_143000.json # Misclassified cases
```

### Fine-Tuning Data Directory

```
tests/fine_tuning_data/
├── train_20251022_143500.jsonl       # Training dataset
└── validation_20251022_143500.jsonl  # Validation dataset
```

## Interpreting Results

### Example Report

```
============================================================
INTENT CLASSIFICATION TEST REPORT
============================================================

OVERALL PERFORMANCE
------------------------------------------------------------
Total Tests:    50
Correct:        47 (94.0%)
Incorrect:      3
Accuracy:       94.0%
Macro Precision: 93.5%
Macro Recall:    94.2%
Macro F1:        93.8%

PER-INTENT PERFORMANCE
------------------------------------------------------------

SCAM:
  Precision:      100.0%  ← No false positives!
  Recall:         93.3%   ← Found 14/15 scams
  F1 Score:       96.5%
  Support:        15 cases
  Avg Confidence: 0.94
  TP/FP/FN/TN:    14/0/1/35

OPPORTUNITY:
  Precision:      87.5%   ← Some false positives
  Recall:         93.3%   ← Found 14/15 opportunities
  F1 Score:       90.3%
  Support:        15 cases
  Avg Confidence: 0.89
  TP/FP/FN/TN:    14/2/1/33

OTHER:
  Precision:      93.3%
  Recall:         93.3%
  F1 Score:       93.3%
  Support:        15 cases
  Avg Confidence: 0.88
  TP/FP/FN/TN:    14/1/1/34
```

### What to Focus On

**If SCAM recall < 95%:**
- ❗ CRITICAL: Missing fraud attempts is dangerous
- Add more SCAM examples to fine-tuning data
- Review missed SCAM cases carefully
- Consider lowering SCAM detection threshold

**If OPPORTUNITY precision < 85%:**
- False positives waste student time
- Review cases misclassified as OPPORTUNITY
- Refine OPPORTUNITY definition
- Add negative examples

**If OTHER is catching too much:**
- Good for safety, but reduces automation
- Review OTHER cases to find patterns
- Consider creating new intent categories
- Improve SCAM/OPPORTUNITY definitions

## Troubleshooting

### Low Overall Accuracy

1. Check if test data quality is good
2. Review intent definitions for clarity
3. Ensure system prompt is well-structured
4. Generate fine-tuning data and train model

### High Misclassification Rate

1. Analyze confusion matrix for patterns
2. Check if intents are well-separated
3. Review ambiguous edge cases
4. Add more training examples for weak areas

### Low Confidence Scores

1. Check if examples are truly clear
2. Review edge cases - may need different thresholds
3. Consider if intents need better definition
4. Fine-tune model with high-confidence examples

## Best Practices

1. **Run tests after ANY changes** to definitions, prompts, or model
2. **Set realistic confidence thresholds** in test cases (0.7-0.9)
3. **Prioritize SCAM detection** - false negatives are dangerous
4. **Monitor trends over time** - save all test results
5. **Fine-tune incrementally** - don't change too much at once
6. **Validate improvements** - always test after fine-tuning
7. **Document changes** - note what was changed and why

## Contributing

When adding test cases:

1. Add to appropriate test data file
2. Follow existing format exactly
3. Set realistic min_confidence
4. Add descriptive description
5. Run tests to validate
6. Update this README if needed

## Support

For questions or issues:
1. Check test results for detailed error messages
2. Review metrics to identify specific problems
3. Consult the fine-tuning improvement report
4. Contact the development team

---

**Last Updated**: 2025-10-22
**Version**: 2.0.0
