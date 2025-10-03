FROM python:3.13.7

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python
