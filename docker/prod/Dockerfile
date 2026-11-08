FROM python:3.14-slim AS installer

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /build

COPY ./pyproject.toml ./uv.lock /build/

ENV UV_COMPILE_BYTECODE=1
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

RUN uv sync --frozen --no-dev --no-install-project


FROM --platform=$BUILDPLATFORM node:20-slim AS jsbuilder

COPY ./pi_control/home/js /web/home/js

WORKDIR /web/home/js

RUN npm install && npm run --prefix=/web/home/js build --verbose && npm prune --production


FROM python:3.14-slim

ENV PYTHONUNBUFFERED=0 \
    PATH="/opt/venv/bin:${PATH}" \
    DEBUG=False \
    STATIC_ROOT=/static \
    GUNICORN_WORKERS=3 \
    HOST=0.0.0.0

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        libffi8 \
        liblcms2-2 \
        gettext \
        iputils-ping \
        calibre && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -r pi && useradd -m -r -g pi pi

COPY --from=installer /opt/venv /opt/venv
COPY ./pi_control /web
COPY --from=jsbuilder /web/home/static/js/app.js /web/home/static/js/app.js

WORKDIR /web

RUN python manage.py collectstatic --no-input

USER pi

CMD ["sh", "-c", "exec gunicorn --bind ${HOST}:80 --workers=${GUNICORN_WORKERS} pi_control.wsgi:application"]
