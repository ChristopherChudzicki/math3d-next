FROM python:3.11.4

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python