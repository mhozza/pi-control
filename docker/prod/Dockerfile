FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /build/requirements.txt

WORKDIR /build

RUN apk add --no-cache --virtual runtime-deps libxml2 libxslt musl postgresql-libs libffi lcms2 gettext && \
    apk add --no-cache --virtual build-deps gcc libffi-dev musl-dev postgresql-dev lcms2-dev git libxml2-dev libxslt-dev npm && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir gunicorn

RUN pip install --no-cache-dir -r requirements.txt

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install . && npm run --prefix=/web/home/js build

RUN apk del build-deps && rm -r /web/home/js/node_modules

WORKDIR /web

ENV DEBUG False
ENV STATIC_ROOT /static

RUN python manage.py collectstatic

ENV GUNICORN_WORKERS 3

CMD gunicorn --bind 0.0.0.0:80 --workers=${GUNICORN_WORKERS} pi_control.wsgi:application
