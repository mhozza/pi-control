FROM python:3.12-slim

ENV PYTHONUNBUFFERED=0

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libpq5 libffi8 liblcms2-2 gettext iputils-ping calibre \
    # Dev deps
    npm \
    # Build deps
    gcc libffi-dev libpq-dev liblcms2-dev git

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY ./pyproject.toml /build/
COPY ./uv.lock /build/

ENV UV_PROJECT_ENVIRONMENT=/usr/local
RUN uv sync --frozen

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install

WORKDIR /web

CMD python manage.py runserver 0.0.0.0:8000
