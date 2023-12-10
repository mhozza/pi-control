FROM python:3.12-slim

ENV PYTHONUNBUFFERED=0

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libpq5 libffi8 liblcms2-2 gettext iputils-ping calibre\
    # Dev deps
    npm \
    # Build deps
    gcc libffi-dev libpq-dev liblcms2-dev git

RUN pip install -U pip
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

RUN poetry install --no-interaction --no-root

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install

WORKDIR /web

CMD python manage.py runserver 0.0.0.0:8000
