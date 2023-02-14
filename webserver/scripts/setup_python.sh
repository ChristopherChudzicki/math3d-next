#!/bin/sh

PIP_DEFAULT_TIMEOUT=100
PIP_DISABLE_PIP_VERSION_CHECK=1
PIP_NO_CACHE_DIR=1
POETRY_VERSION=1.3.1

# Install Poetry
pip install "poetry==$POETRY_VERSION"

# Install dependencies
poetry install && poetry build