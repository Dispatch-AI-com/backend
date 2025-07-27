.PHONY: lint lint-fix format test typecheck check-all

CODE = .

lint:
	uv run ruff check $(CODE)

lint-fix:
	uv run ruff check --fix $(CODE)

format:
	uv run ruff format $(CODE)

test:
	uv run pytest $(CODE)/app/test/

typecheck:
	uv run mypy $(CODE)/app

check-all: lint typecheck test
	@echo "✅ All checks passed!"
