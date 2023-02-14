FROM python:3.11.2

WORKDIR /src
COPY /webserver/ /src/

RUN chmod +x /src/scripts/setup_python.sh
RUN /src/scripts/setup_python.sh