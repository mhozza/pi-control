FROM python:3.7-slim

ENV PYTHONUNBUFFERED=0

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libpq5 libffi6 liblcms2-2 gettext iputils-ping calibre \
    # Build deps
    gcc libffi-dev libpq-dev liblcms2-dev git npm && \
    # Python deps
    pip install --no-cache-dir --upgrade pip poetry gunicorn && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-root --no-dev

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install . && npm run --prefix=/web/home/js build

RUN apt-get purge -y --auto-remove gcc libffi-dev libpq-dev liblcms2-dev git npm && \
    apt-get clean -y && \
    rm -r /web/home/js && \
    rm -r /build

WORKDIR /web

ENV DEBUG False
ENV STATIC_ROOT /static

RUN python manage.py collectstatic

ENV GUNICORN_WORKERS 3
ENV HOST=0.0.0.0

CMD gunicorn --bind ${HOST}:80 --workers=${GUNICORN_WORKERS} pi_control.wsgi:application
