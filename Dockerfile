FROM python:3.12.4

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python
