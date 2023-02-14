setup_python: export PIP_DEFAULT_TIMEOUT = 100
setup_python: export PIP_DISABLE_PIP_VERSION_CHECK = 1
setup_python: export PIP_DISABLE_PIP_VERSION_CHECK = 1
setup_python: export POETRY_VERSION = 1.3.1
setup_python:
	pip install "poetry==${POETRY_VERSION}"
	poetry install
	poetry build


FORMAT_PYTHON = black .
SORT_PYTHON_IMPORTS = isort .

format-fix:
	${FORMAT_PYTHON}
	${SORT_PYTHON_IMPORTS}

format-check:
	${FORMAT_PYTHON} --check
	${SORT_PYTHON_IMPORTS} --check-only