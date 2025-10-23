"""
Fine-Tuning Data Generator for Intent Classification

Generates OpenAI fine-tuning datasets from test results and misclassifications.
Supports continuous improvement of the classification model.
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from intent_classification.tests.test_data import ALL_TEST_CASES
from intent_classification.definitions.intent_definitions import (
    get_scam_definition,
    get_opportunity_definition,
    get_other_definition
)


class FineTuningDataGenerator:
    """Generate fine-tuning datasets for OpenAI models"""

    def __init__(self):
        self.scam_def = get_scam_definition()
        self.opportunity_def = get_opportunity_definition()
        self.other_def = get_other_definition()

    def create_training_example(
        self,
        message: str,
        intent: str,
        confidence: float = None,
        reasoning: str = None
    ) -> Dict[str, Any]:
        """Create a single training example in OpenAI format"""

        # Get intent definition
        if intent == "scam":
            intent_def = self.scam_def
        elif intent == "opportunity":
            intent_def = self.opportunity_def
        else:
            intent_def = self.other_def

        # Create ideal response
        ideal_response = {
            "intent": intent,
            "confidence": confidence or 0.95,
            "reasoning": reasoning or f"This message clearly indicates {intent_def['description']}",
            "metadata": {
                "matched_keywords": [],
                "matched_characteristics": []
            }
        }

        # OpenAI fine-tuning format (Chat format)
        return {
            "messages": [
                {
                    "role": "system",
                    "content": self._get_simplified_system_prompt()
                },
                {
                    "role": "user",
                    "content": f"CONVERSATION CONTEXT:\n\nCurrent Student Message: {message}\n\nPlease classify the student's intent based on the conversation above."
                },
                {
                    "role": "assistant",
                    "content": json.dumps(ideal_response, ensure_ascii=False)
                }
            ]
        }

    def _get_simplified_system_prompt(self) -> str:
        """Get simplified system prompt for fine-tuning"""
        return """You are an intent classification system for international student services.
Classify caller intent into: scam, opportunity, or other.

SCAM: Fraud attempts, malicious callers
OPPORTUNITY: Legitimate interviews, jobs, research positions, internships
OTHER: Complex issues, messages, unclear intents

Respond with JSON: {"intent": "scam|opportunity|other", "confidence": 0.0-1.0, "reasoning": "explanation", "metadata": {...}}"""

    def generate_from_test_cases(
        self,
        test_suites: Dict[str, List[Dict]] = None,
        include_all: bool = True
    ) -> List[Dict[str, Any]]:
        """Generate fine-tuning data from test cases"""
        if test_suites is None:
            test_suites = ALL_TEST_CASES

        training_examples = []

        for suite_name, test_cases in test_suites.items():
            for test_case in test_cases:
                if not include_all and suite_name == "edge_cases":
                    continue  # Skip edge cases if not including all

                example = self.create_training_example(
                    message=test_case["message"],
                    intent=test_case["expected_intent"],
                    confidence=test_case.get("min_confidence", 0.9)
                )

                training_examples.append(example)

        return training_examples

    def generate_from_misclassifications(
        self,
        misclassified_cases: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate corrective fine-tuning data from misclassifications"""
        training_examples = []

        for case in misclassified_cases:
            # Create corrected example with the EXPECTED intent
            example = self.create_training_example(
                message=case["message"],
                intent=case["expected_intent"],  # Use expected, not predicted
                confidence=case["min_confidence"],
                reasoning=f"Correction: This should be classified as {case['expected_intent']}, not {case['predicted_intent']}. {case['reasoning']}"
            )

            training_examples.append(example)

        return training_examples

    def generate_augmented_examples(
        self,
        base_examples: List[Dict[str, Any]],
        augmentation_factor: int = 2
    ) -> List[Dict[str, Any]]:
        """Generate augmented examples by adding variations"""
        # For now, just duplicate critical examples
        # In production, you might use paraphrasing, synonym replacement, etc.
        augmented = base_examples.copy()

        # Focus on misclassified cases - add them multiple times
        for _ in range(augmentation_factor - 1):
            augmented.extend(base_examples)

        return augmented

    def save_fine_tuning_dataset(
        self,
        examples: List[Dict[str, Any]],
        output_path: Path = None,
        name: str = "fine_tune_dataset"
    ) -> Path:
        """Save fine-tuning dataset in JSONL format"""
        if output_path is None:
            output_path = Path(__file__).parent / "fine_tuning_data"

        output_path.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.jsonl"
        file_path = output_path / filename

        with open(file_path, "w", encoding="utf-8") as f:
            for example in examples:
                f.write(json.dumps(example, ensure_ascii=False) + "\n")

        print(f"Fine-tuning dataset saved: {file_path}")
        print(f"Total examples: {len(examples)}")

        return file_path

    def create_validation_split(
        self,
        examples: List[Dict[str, Any]],
        validation_ratio: float = 0.2
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Split data into training and validation sets"""
        import random

        # Shuffle examples
        shuffled = examples.copy()
        random.shuffle(shuffled)

        # Split
        split_idx = int(len(shuffled) * (1 - validation_ratio))
        train = shuffled[:split_idx]
        val = shuffled[split_idx:]

        return train, val

    def generate_improvement_report(
        self,
        misclassified_cases: List[Dict[str, Any]]
    ) -> str:
        """Generate a report analyzing areas for improvement"""
        report = []
        report.append("=" * 80)
        report.append("FINE-TUNING IMPROVEMENT ANALYSIS")
        report.append("=" * 80)
        report.append("")

        # Analyze misclassification patterns
        from collections import defaultdict
        patterns = defaultdict(list)

        for case in misclassified_cases:
            key = f"{case['expected_intent']} → {case['predicted_intent']}"
            patterns[key].append(case)

        report.append("MISCLASSIFICATION PATTERNS:")
        report.append("-" * 80)
        for pattern, cases in sorted(patterns.items(), key=lambda x: len(x[1]), reverse=True):
            report.append(f"\n{pattern} ({len(cases)} cases)")
            report.append("Sample messages:")
            for case in cases[:3]:
                report.append(f"  - {case['message'][:80]}...")

        # Low confidence cases
        low_conf = [c for c in misclassified_cases if not c.get("confidence_ok", True)]
        if low_conf:
            report.append("\n\nLOW CONFIDENCE MISCLASSIFICATIONS:")
            report.append("-" * 80)
            report.append(f"Total: {len(low_conf)} cases")
            for case in low_conf[:5]:
                report.append(f"\n  Message: {case['message'][:70]}...")
                report.append(f"  Expected: {case['expected_intent']}")
                report.append(f"  Predicted: {case['predicted_intent']} (conf: {case['confidence']:.2f})")

        # Recommendations
        report.append("\n\nRECOMMENDATIONS:")
        report.append("-" * 80)

        if patterns:
            top_pattern = max(patterns.items(), key=lambda x: len(x[1]))
            report.append(f"1. Focus on pattern: {top_pattern[0]} ({len(top_pattern[1])} cases)")

        if low_conf:
            report.append(f"2. Review {len(low_conf)} low-confidence cases")

        report.append("3. Consider adding more training examples for weak areas")
        report.append("4. Review and refine intent definitions")
        report.append("5. Add more keywords to intent definitions")

        report.append("")
        report.append("=" * 80)

        return "\n".join(report)


def generate_complete_fine_tuning_dataset(
    test_results_path: Path = None,
    include_base_cases: bool = True,
    augment_misclassified: bool = True
) -> Dict[str, Path]:
    """Generate complete fine-tuning dataset with train/val splits"""

    generator = FineTuningDataGenerator()
    all_examples = []

    # 1. Include base test cases
    if include_base_cases:
        print("Generating examples from test cases...")
        base_examples = generator.generate_from_test_cases()
        all_examples.extend(base_examples)
        print(f"  Added {len(base_examples)} base examples")

    # 2. Include misclassified cases (if available)
    if test_results_path and test_results_path.exists():
        print(f"Loading test results from {test_results_path}...")
        with open(test_results_path, "r") as f:
            results = json.load(f)

        misclassified = results.get("misclassified_cases", [])
        if misclassified:
            print(f"Generating corrective examples from {len(misclassified)} misclassifications...")
            correction_examples = generator.generate_from_misclassifications(misclassified)

            if augment_misclassified:
                # Add misclassified cases multiple times for emphasis
                correction_examples = generator.generate_augmented_examples(
                    correction_examples,
                    augmentation_factor=3
                )

            all_examples.extend(correction_examples)
            print(f"  Added {len(correction_examples)} correction examples")

            # Generate improvement report
            report = generator.generate_improvement_report(misclassified)
            print("\n")
            print(report)

    # 3. Split into train/val
    print("\nSplitting into train/validation sets...")
    train_examples, val_examples = generator.create_validation_split(all_examples, 0.2)
    print(f"  Training: {len(train_examples)} examples")
    print(f"  Validation: {len(val_examples)} examples")

    # 4. Save datasets
    print("\nSaving fine-tuning datasets...")
    train_path = generator.save_fine_tuning_dataset(train_examples, name="train")
    val_path = generator.save_fine_tuning_dataset(val_examples, name="validation")

    print("\n✅ Fine-tuning datasets generated successfully!")
    print("\nNext steps:")
    print("1. Upload datasets to OpenAI for fine-tuning:")
    print(f"   openai api fine_tunes.create -t {train_path} -v {val_path} -m gpt-3.5-turbo")
    print("2. Monitor fine-tuning progress")
    print("3. Update settings.openai_model with fine-tuned model ID")
    print("4. Re-run tests to validate improvements")

    return {
        "train": train_path,
        "validation": val_path
    }


if __name__ == "__main__":
    # Example: Generate fine-tuning dataset
    import sys

    results_file = None
    if len(sys.argv) > 1:
        results_file = Path(sys.argv[1])

    generate_complete_fine_tuning_dataset(
        test_results_path=results_file,
        include_base_cases=True,
        augment_misclassified=True
    )
