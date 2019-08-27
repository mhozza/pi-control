FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /build/requirements.txt

WORKDIR /build

RUN apk add --no-cache --virtual runtime-deps libxml2 libxslt musl postgresql-libs libffi lcms2 gettext && \
    apk add --no-cache --virtual build-deps gcc libffi-dev musl-dev postgresql-dev lcms2-dev git libxml2-dev libxslt-dev && \
    pip install --upgrade pip && \
    pip install gunicorn

RUN pip install --no-cache-dir -r requirements.txt && \
    apk del build-deps

WORKDIR /web

COPY ./pi_control /web

RUN python manage.py collectstatic

ENV GUNICORN_WORKERS 2

CMD gunicorn --bind 0.0.0.0:80 --workers=${GUNICORN_WORKERS} --reload pi_control.wsgi:application