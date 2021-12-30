FROM python:3.9-slim as base

ENV PYTHONUNBUFFERED=0

RUN apt-get update -y
RUN pip install -U pip

FROM base as builder

RUN apt-get install -y curl

RUN curl -sSL https://raw.githubusercontent.com/sdispater/poetry/master/get-poetry.py | python \
    && ln -s /root/.poetry/bin/poetry /usr/local/bin/poetry

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

WORKDIR /build

RUN set -x \
    && poetry export --without-hashes -f requirements.txt > requirements.txt


FROM base as installer

# Disable using Rust to build cryptography (v3.4.7 only).
ENV CRYPTOGRAPHY_DONT_BUILD_RUST=1

# Build deps
RUN apt-get install -y gcc libffi-dev libpq-dev liblcms2-dev libssl-dev git

COPY --from=builder /build/requirements.txt /

RUN set -x \
    && pip install --root /install --no-warn-script-location -r requirements.txt


FROM --platform=$BUILDPLATFORM node:15-slim as jsbuilder

COPY ./pi_control/home/js /web/home/js

WORKDIR /web/home/js

RUN npm install && npm run --prefix=/web/home/js build --verbose && npm prune --production

FROM base

RUN groupadd -r pi && useradd -m -r -g pi pi

COPY ./docker/prod/pip.conf /etc/

RUN apt-get install -y libpq5 libffi7 liblcms2-2 gettext iputils-ping calibre && \
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
