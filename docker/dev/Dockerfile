FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /requirements/requirements.txt

WORKDIR /requirements

RUN apk add --no-cache --virtual runtime-deps libxml2 libxslt musl postgresql-libs libffi lcms2 gettext

RUN apk add --no-cache --virtual build-deps gcc libffi-dev musl-dev postgresql-dev lcms2-dev git libxml2-dev libxslt-dev

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN apk del build-deps

WORKDIR /web

COPY ./pi_control /web

CMD python manage.py runserver 0.0.0.0:8000