FROM python:3.12.2

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python
