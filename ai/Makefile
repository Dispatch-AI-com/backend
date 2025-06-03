.PHONY: lint lint-fix format

CODE = .

lint:        ## 只报告问题
	ruff check $(CODE)

lint-fix:    ## 自动修复
	ruff check --fix $(CODE)

format:      ## 统一格式
	ruff format $(CODE)
