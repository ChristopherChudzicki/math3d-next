FROM python:3.13.0

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python
