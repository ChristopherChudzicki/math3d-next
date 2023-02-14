FROM python:3.11.2

WORKDIR /src
COPY /webserver/ /src/

RUN make -C /src setup_python