FROM python:3.11.2

WORKDIR /src
COPY /webserver/ /src/webserver

RUN make -C /src/webserver setup_python