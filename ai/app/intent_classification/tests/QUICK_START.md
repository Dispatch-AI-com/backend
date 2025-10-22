# Quick Start Guide - Intent Classification Testing

## Run Tests (Simple)

```bash
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai
./app/intent_classification/tests/run_tests.sh
```

This single command will:
1. ✅ Run all 50 test cases
2. ✅ Calculate accuracy, precision, recall, F1 scores
3. ✅ Generate confusion matrix
4. ✅ Create fine-tuning datasets
5. ✅ Save all results

## View Results

### Test Report (Human-Readable)
```bash
cat app/intent_classification/tests/results/report_*.txt
```

### Metrics (JSON)
```bash
cat app/intent_classification/tests/results/metrics_*.json | jq
```

### Misclassified Cases
```bash
cat app/intent_classification/tests/results/misclassified_*.json | jq
```

## Key Metrics to Check

| Metric | Good | Warning | Action Needed |
|--------|------|---------|---------------|
| **Accuracy** | > 90% | 85-90% | < 85% |
| **SCAM Recall** | > 95% | 90-95% | < 90% ⚠️ CRITICAL |
| **OPPORTUNITY Precision** | > 85% | 80-85% | < 80% |
| **F1 Score (all)** | > 0.85 | 0.75-0.85 | < 0.75 |

## Common Scenarios

### First Time Setup
```bash
# 1. Run initial baseline tests
./app/intent_classification/tests/run_tests.sh

# 2. Review results
cat app/intent_classification/tests/results/report_*.txt
```

### After Making Changes
```bash
# 1. Run tests
./app/intent_classification/tests/run_tests.sh

# 2. Compare to previous results
diff app/intent_classification/tests/results/report_PREVIOUS.txt \
     app/intent_classification/tests/results/report_LATEST.txt
```

### Generate Fine-Tuning Data Only
```bash
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai
.venv/bin/python app/intent_classification/tests/fine_tuning.py
```

### Use Fine-Tuned Model

After OpenAI fine-tuning completes:

```python
# Update in config or .env
OPENAI_MODEL=ft:gpt-3.5-turbo:your-org:intent-classification:abc123

# Run tests to validate
./app/intent_classification/tests/run_tests.sh
```

## Interpreting Output

### Good Result Example
```
OVERALL PERFORMANCE
Total Tests:    50
Correct:        47 (94.0%)  ← Good!
Accuracy:       94.0%       ← Good!
Macro F1:       93.8%       ← Good!

SCAM:
  Recall:         100.0%     ← Perfect! No missed scams

OPPORTUNITY:
  Precision:      93.3%      ← Good! Low false positives
```

### Needs Improvement Example
```
OVERALL PERFORMANCE
Total Tests:    50
Correct:        40 (80.0%)  ← Low accuracy
Accuracy:       80.0%       ← Needs work

SCAM:
  Recall:         86.7%      ← ⚠️ Missing scams! Critical!

OPPORTUNITY:
  Precision:      73.3%      ← Too many false positives
```

## Troubleshooting

### "Module not found" error
```bash
cd /Users/markwang/Documents/Dispatch\ AI/backend/ai
source .venv/bin/activate
```

### "No test results found"
- First run creates baseline
- Results saved in `tests/results/`
- Look for `metrics_*.json` files

### Tests running slow
- Normal: ~2-3 seconds per test (50 tests = ~2 minutes)
- Slow: Check OpenAI API connection
- Very slow: Check timeout settings

## Next Steps

1. **Baseline**: Run tests to establish baseline
2. **Analyze**: Review misclassified cases
3. **Improve**: Add test cases or refine definitions
4. **Fine-tune**: Generate data and train model
5. **Validate**: Re-run tests with fine-tuned model
6. **Deploy**: Update production model
7. **Monitor**: Continue testing regularly

## Quick Commands Reference

```bash
# Run everything
./app/intent_classification/tests/run_tests.sh

# Tests only
.venv/bin/python app/intent_classification/tests/test_runner.py

# Fine-tuning only
.venv/bin/python app/intent_classification/tests/fine_tuning.py

# With specific results file
.venv/bin/python app/intent_classification/tests/fine_tuning.py \
  app/intent_classification/tests/results/metrics_20251022_143000.json

# View latest report
ls -t app/intent_classification/tests/results/report_*.txt | head -1 | xargs cat

# View latest metrics
ls -t app/intent_classification/tests/results/metrics_*.json | head -1 | xargs cat | jq

# Count test files
echo "SCAM: $(grep -c '"id"' app/intent_classification/tests/test_data/scam_cases.py)"
echo "OPPORTUNITY: $(grep -c '"id"' app/intent_classification/tests/test_data/opportunity_cases.py)"
echo "OTHER: $(grep -c '"id"' app/intent_classification/tests/test_data/other_cases.py)"
```

## Files Generated

```
tests/
├── results/
│   ├── metrics_YYYYMMDD_HHMMSS.json       # Full metrics
│   ├── report_YYYYMMDD_HHMMSS.txt         # Human report
│   └── misclassified_YYYYMMDD_HHMMSS.json # Failed cases
└── fine_tuning_data/
    ├── train_YYYYMMDD_HHMMSS.jsonl        # Training set
    └── validation_YYYYMMDD_HHMMSS.jsonl   # Validation set
```

## Getting Help

See full documentation: `tests/README.md`

For issues:
1. Check test output for errors
2. Review results files
3. Check logs
4. Contact development team
