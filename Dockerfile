FROM python:3.11.2

COPY /webserver/ /src/webserver

WORKDIR /src/webserver

RUN make setup_python