.PHONY: lint lint-fix format

CODE = .

lint:
	uv run ruff check $(CODE)

lint-fix:
	uv run ruff check --fix $(CODE)

format:
	uv run ruff format $(CODE)
