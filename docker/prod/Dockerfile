# syntax = docker/dockerfile:experimental
FROM python:3.11-slim as base

ENV PYTHONUNBUFFERED=0

RUN apt-get update -y
RUN pip install -U pip

# Deps for building cryptography
FROM base as basedeps

ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

RUN apt-get install -y curl gcc build-essential libssl-dev libffi-dev git pkg-config python3-cryptography

RUN --security=insecure mkdir -p /root/.cargo && chmod 777 /root/.cargo && mount -t tmpfs none /root/.cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain=1.74.0 -y
ENV PATH="/root/.cargo/bin:${PATH}"
ENV RUSTUP_TOOLCHAIN=1.74.0

# RUN pip install cryptography
RUN pip install --no-cache-dir cryptography

# Generate requirements
FROM basedeps as builder

RUN apt-get install -y curl

ENV POETRY_HOME=/usr/local

RUN pip install poetry

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

WORKDIR /build

RUN set -x \
    && poetry export --without-hashes -f requirements.txt -o requirements.txt

# Install the packages from requirements
FROM basedeps as installer

# Build deps
RUN apt-get install -y libpq-dev liblcms2-dev git

COPY --from=builder /build/requirements.txt /

RUN set -x \
    && pip install --root /install --no-warn-script-location -r requirements.txt


FROM --platform=$BUILDPLATFORM node:15-slim as jsbuilder

COPY ./pi_control/home/js /web/home/js

WORKDIR /web/home/js

RUN npm install && npm run --prefix=/web/home/js build --verbose && npm prune --production

FROM base

RUN groupadd -r pi && useradd -m -r -g pi pi

RUN apt-get install -y libpq5 libffi8 liblcms2-2 gettext iputils-ping calibre && \
    # Python deps
    pip install gunicorn

COPY --from=installer /install /
COPY ./pi_control /web
COPY --from=jsbuilder /web/home/static/js/app.js /web/home/static/js/app.js

WORKDIR /web

ENV DEBUG False
ENV STATIC_ROOT /static

RUN python manage.py collectstatic

ENV GUNICORN_WORKERS 3
ENV HOST=0.0.0.0

USER pi

CMD gunicorn --bind ${HOST}:80 --workers=${GUNICORN_WORKERS} pi_control.wsgi:application
