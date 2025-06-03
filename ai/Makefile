.PHONY: lint lint-fix format

CODE = .

lint:        ## 只报告问题
	uv run ruff check $(CODE)

lint-fix:    ## 自动修复
	uv run ruff check --fix $(CODE)

format:      ## 统一格式
	uv run ruff format $(CODE)
