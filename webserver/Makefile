.PHONY: setup_python
setup_python: export PIP_DEFAULT_TIMEOUT = 100
setup_python: export PIP_DISABLE_PIP_VERSION_CHECK = 1
setup_python: export PIP_DISABLE_PIP_VERSION_CHECK = 1
setup_python: export POETRY_VERSION = 1.3.1
setup_python:
	pip install "poetry==${POETRY_VERSION}"
	poetry config virtualenvs.create false
	poetry install
	poetry build


FORMAT_PYTHON = black .
SORT_PYTHON_IMPORTS = isort .

.PHONY: format-fix
format-fix: ## Reformat code with black and isort
	${FORMAT_PYTHON}
	${SORT_PYTHON_IMPORTS}

.PHONY: format-check
format-check: ## Check formatting code with black and isort
	${FORMAT_PYTHON} --check
	${SORT_PYTHON_IMPORTS} --check-only

.PHONY: test
test: ## Run tests
	@echo "TODO: Add tests"

.PHONY: help
# Adapted from https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: devserver
devserver: ## Start django webserver in dev mode; restarts when crashes
	bash -c "while true; do python ./manage.py runserver 0.0.0.0:8000; sleep 2; done"