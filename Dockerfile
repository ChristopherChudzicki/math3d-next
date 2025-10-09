FROM python:3.14.0

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python
