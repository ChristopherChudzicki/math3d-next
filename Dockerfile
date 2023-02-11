FROM python:3.11.2

WORKDIR /src
COPY /webserver/ /src/

# Install packages and add repo needed for postgres 9.6
COPY /webserver/apt.txt /tmp/apt.txt
RUN apt-get update
RUN apt-get install -y $(grep -vE "^\s*#" apt.txt  | tr "\n" " ")

ENV PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=1.3.1

RUN pip install "poetry==$POETRY_VERSION"

RUN poetry config virtualenvs.create false && \
    poetry install --no-root && \
    poetry build