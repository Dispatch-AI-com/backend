"""
Intent Classification Test Runner

Runs all test cases and calculates performance metrics including:
- Accuracy, Precision, Recall, F1 Score
- Confusion Matrix
- Per-intent performance metrics
- Misclassification analysis
"""

import asyncio
import sys
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from intent_classification import IntentClassifier
from intent_classification.tests.test_data import (
    ALL_TEST_CASES
)


class IntentClassificationMetrics:
    """Calculate and track classification performance metrics"""

    def __init__(self):
        self.results: List[Dict[str, Any]] = []
        self.confusion_matrix: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    def add_result(
        self,
        test_case: Dict[str, Any],
        predicted_intent: str,
        confidence: float,
        reasoning: str,
        metadata: Dict[str, Any]
    ):
        """Add a test result to metrics"""
        expected = test_case["expected_intent"]
        is_correct = predicted_intent == expected

        result = {
            "test_id": test_case["id"],
            "message": test_case["message"],
            "expected_intent": expected,
            "predicted_intent": predicted_intent,
            "confidence": confidence,
            "reasoning": reasoning,
            "metadata": metadata,
            "is_correct": is_correct,
            "min_confidence": test_case.get("min_confidence", 0.0),
            "confidence_ok": confidence >= test_case.get("min_confidence", 0.0)
        }

        self.results.append(result)
        self.confusion_matrix[expected][predicted_intent] += 1

    def calculate_metrics(self) -> Dict[str, Any]:
        """Calculate comprehensive performance metrics"""
        if not self.results:
            return {}

        # Overall metrics
        total = len(self.results)
        correct = sum(1 for r in self.results if r["is_correct"])
        accuracy = correct / total

        # Per-intent metrics
        intent_metrics = {}
        all_intents = ["scam", "opportunity", "other"]

        for intent in all_intents:
            # True Positives: correctly predicted as this intent
            tp = sum(1 for r in self.results
                    if r["expected_intent"] == intent and r["predicted_intent"] == intent)

            # False Positives: incorrectly predicted as this intent
            fp = sum(1 for r in self.results
                    if r["expected_intent"] != intent and r["predicted_intent"] == intent)

            # False Negatives: should be this intent but predicted as something else
            fn = sum(1 for r in self.results
                    if r["expected_intent"] == intent and r["predicted_intent"] != intent)

            # True Negatives: correctly predicted as NOT this intent
            tn = sum(1 for r in self.results
                    if r["expected_intent"] != intent and r["predicted_intent"] != intent)

            # Calculate metrics
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

            # Confidence statistics
            intent_results = [r for r in self.results if r["expected_intent"] == intent]
            avg_confidence = sum(r["confidence"] for r in intent_results) / len(intent_results) if intent_results else 0.0
            low_confidence_count = sum(1 for r in intent_results if not r["confidence_ok"])

            intent_metrics[intent] = {
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
                "true_negatives": tn,
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score,
                "support": tp + fn,  # Total actual instances
                "avg_confidence": avg_confidence,
                "low_confidence_count": low_confidence_count
            }

        # Macro-averaged metrics (average across intents)
        macro_precision = sum(m["precision"] for m in intent_metrics.values()) / len(all_intents)
        macro_recall = sum(m["recall"] for m in intent_metrics.values()) / len(all_intents)
        macro_f1 = sum(m["f1_score"] for m in intent_metrics.values()) / len(all_intents)

        # Misclassification analysis
        misclassified = [r for r in self.results if not r["is_correct"]]
        misclassification_patterns = defaultdict(int)
        for r in misclassified:
            pattern = f"{r['expected_intent']} → {r['predicted_intent']}"
            misclassification_patterns[pattern] += 1

        return {
            "summary": {
                "total_tests": total,
                "correct": correct,
                "incorrect": len(misclassified),
                "accuracy": accuracy,
                "macro_precision": macro_precision,
                "macro_recall": macro_recall,
                "macro_f1": macro_f1
            },
            "per_intent": intent_metrics,
            "confusion_matrix": dict(self.confusion_matrix),
            "misclassification_patterns": dict(sorted(
                misclassification_patterns.items(),
                key=lambda x: x[1],
                reverse=True
            )),
            "misclassified_cases": misclassified
        }

    def generate_report(self, metrics: Dict[str, Any]) -> str:
        """Generate a human-readable report"""
        report = []
        report.append("=" * 80)
        report.append("INTENT CLASSIFICATION TEST REPORT")
        report.append("=" * 80)
        report.append("")

        # Summary
        summary = metrics["summary"]
        report.append("OVERALL PERFORMANCE")
        report.append("-" * 80)
        report.append(f"Total Tests:    {summary['total_tests']}")
        report.append(f"Correct:        {summary['correct']} ({summary['accuracy']:.1%})")
        report.append(f"Incorrect:      {summary['incorrect']}")
        report.append(f"Accuracy:       {summary['accuracy']:.1%}")
        report.append(f"Macro Precision: {summary['macro_precision']:.1%}")
        report.append(f"Macro Recall:    {summary['macro_recall']:.1%}")
        report.append(f"Macro F1:        {summary['macro_f1']:.1%}")
        report.append("")

        # Per-intent metrics
        report.append("PER-INTENT PERFORMANCE")
        report.append("-" * 80)
        for intent, m in metrics["per_intent"].items():
            report.append(f"\n{intent.upper()}:")
            report.append(f"  Precision:      {m['precision']:.1%}")
            report.append(f"  Recall:         {m['recall']:.1%}")
            report.append(f"  F1 Score:       {m['f1_score']:.1%}")
            report.append(f"  Support:        {m['support']} cases")
            report.append(f"  Avg Confidence: {m['avg_confidence']:.2f}")
            report.append(f"  TP/FP/FN/TN:    {m['true_positives']}/{m['false_positives']}/{m['false_negatives']}/{m['true_negatives']}")
        report.append("")

        # Confusion Matrix
        report.append("CONFUSION MATRIX")
        report.append("-" * 80)
        intents = ["scam", "opportunity", "other"]
        header = "Actual/Predicted".ljust(20) + "".join(i.ljust(15) for i in intents)
        report.append(header)
        report.append("-" * 80)

        for actual in intents:
            row = actual.ljust(20)
            for predicted in intents:
                count = metrics["confusion_matrix"].get(actual, {}).get(predicted, 0)
                row += str(count).ljust(15)
            report.append(row)
        report.append("")

        # Misclassification patterns
        if metrics["misclassification_patterns"]:
            report.append("MISCLASSIFICATION PATTERNS")
            report.append("-" * 80)
            for pattern, count in list(metrics["misclassification_patterns"].items())[:10]:
                report.append(f"{pattern.ljust(30)} {count} cases")
            report.append("")

        # Top misclassified cases
        if metrics["misclassified_cases"]:
            report.append("TOP MISCLASSIFIED CASES (First 10)")
            report.append("-" * 80)
            for i, case in enumerate(metrics["misclassified_cases"][:10], 1):
                report.append(f"\n{i}. {case['test_id']}")
                report.append(f"   Message: {case['message'][:70]}...")
                report.append(f"   Expected: {case['expected_intent']}")
                report.append(f"   Predicted: {case['predicted_intent']} (confidence: {case['confidence']:.2f})")
                report.append(f"   Reasoning: {case['reasoning'][:100]}...")

        report.append("")
        report.append("=" * 80)

        return "\n".join(report)


class IntentTestRunner:
    """Run intent classification tests and generate metrics"""

    def __init__(self):
        self.classifier = IntentClassifier()
        self.metrics = IntentClassificationMetrics()

    async def run_test_case(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single test case"""
        result = await self.classifier.classify_intent(test_case["message"])

        self.metrics.add_result(
            test_case=test_case,
            predicted_intent=result["intent"],
            confidence=result["confidence"],
            reasoning=result["reasoning"],
            metadata=result["metadata"]
        )

        return result

    async def run_all_tests(self, test_suites: Dict[str, List[Dict]] = None) -> Dict[str, Any]:
        """Run all test cases"""
        if test_suites is None:
            test_suites = ALL_TEST_CASES

        print("Running intent classification tests...")
        print()

        total_tests = sum(len(cases) for cases in test_suites.values())
        current = 0

        for suite_name, test_cases in test_suites.items():
            print(f"Testing {suite_name.upper()} ({len(test_cases)} cases)...")

            for test_case in test_cases:
                current += 1
                await self.run_test_case(test_case)

                # Progress indicator
                if current % 5 == 0:
                    print(f"  Progress: {current}/{total_tests}")

        print()
        print("All tests completed!")
        print()

        # Calculate metrics
        metrics = self.metrics.calculate_metrics()

        return metrics

    def save_results(self, metrics: Dict[str, Any], output_dir: str = None):
        """Save test results to files"""
        if output_dir is None:
            output_dir = Path(__file__).parent / "results"
        else:
            output_dir = Path(output_dir)

        output_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save JSON metrics
        json_path = output_dir / f"metrics_{timestamp}.json"
        with open(json_path, "w") as f:
            json.dump(metrics, f, indent=2)

        # Save text report
        report = self.metrics.generate_report(metrics)
        report_path = output_dir / f"report_{timestamp}.txt"
        with open(report_path, "w") as f:
            f.write(report)

        # Save misclassified cases for fine-tuning
        if metrics["misclassified_cases"]:
            finetune_path = output_dir / f"misclassified_{timestamp}.json"
            with open(finetune_path, "w") as f:
                json.dump(metrics["misclassified_cases"], f, indent=2)

        print(f"Results saved to {output_dir}/")
        print(f"  - Metrics: {json_path.name}")
        print(f"  - Report: {report_path.name}")
        if metrics["misclassified_cases"]:
            print(f"  - Misclassified: {finetune_path.name}")

        return output_dir


async def main():
    """Main test runner"""
    runner = IntentTestRunner()

    # Run all tests
    metrics = await runner.run_all_tests()

    # Print report
    report = runner.metrics.generate_report(metrics)
    print(report)

    # Save results
    runner.save_results(metrics)

    return metrics


if __name__ == "__main__":
    asyncio.run(main())
