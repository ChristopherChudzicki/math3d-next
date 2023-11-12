FROM python:3.11.6

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python