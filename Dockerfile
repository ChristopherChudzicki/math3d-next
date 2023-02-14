FROM python:3.11.2

WORKDIR /src
COPY /webserver/ /src/

ENV PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=1.3.1

RUN pip install "poetry==$POETRY_VERSION"

RUN poetry install && poetry build