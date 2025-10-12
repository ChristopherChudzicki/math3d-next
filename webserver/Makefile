.PHONY: setup_python
setup_python: export PIP_DEFAULT_TIMEOUT = 100
setup_python: export PIP_DISABLE_PIP_VERSION_CHECK = 1
setup_python:
	python -m pip install --upgrade pip
	python -m pip install uv
	uv sync --all-groups --frozen
	uv build

.PHONY: help
# Adapted from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: devserver
devserver: ## Start django webserver in dev mode; restarts when crashes
	uv run ./manage.py migrate
	bash -c "while true; do uv run ./manage.py runserver 0.0.0.0:8000; sleep 2; done"

.PHONY: test
test: ## Run tests
	uv run pytest -sv --ds main.test_settings $(ARGS)

.PHONY: typecheck
typecheck: ## Run MyPy typechecker
	uv run mypy .
