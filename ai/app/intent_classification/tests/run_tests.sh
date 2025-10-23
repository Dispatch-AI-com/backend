#!/bin/bash

# Intent Classification Test Runner Script
# Runs tests and generates fine-tuning data

set -e

cd "$(dirname "$0")/../../.."

echo "=========================================="
echo "Intent Classification Testing Suite"
echo "=========================================="
echo ""

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Using system Python."
fi

# Run tests
echo "1. Running classification tests..."
echo ""
python app/intent_classification/tests/test_runner.py

echo ""
echo "=========================================="
echo ""

# Find latest metrics file
LATEST_METRICS=$(ls -t app/intent_classification/tests/results/metrics_*.json 2>/dev/null | head -1)

if [ -z "$LATEST_METRICS" ]; then
    echo "⚠️  No test results found. Generating fine-tuning data from base cases only."
    echo ""
    python app/intent_classification/tests/fine_tuning.py
else
    echo "2. Generating fine-tuning data from results..."
    echo "   Using: $LATEST_METRICS"
    echo ""
    python app/intent_classification/tests/fine_tuning.py "$LATEST_METRICS"
fi

echo ""
echo "=========================================="
echo "✅ Testing and fine-tuning data generation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review test report in: app/intent_classification/tests/results/"
echo "  2. Upload fine-tuning data to OpenAI (see README.md)"
echo "  3. Monitor fine-tuning progress"
echo "  4. Update model configuration with fine-tuned model ID"
echo "  5. Re-run tests to validate improvements"
echo ""
