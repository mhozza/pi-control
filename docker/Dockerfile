FROM python:3.7-alpine

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /web/requirements.txt
WORKDIR /web

RUN apk add --no-cache --virtual runtime-deps libxml2 libxslt musl postgresql-libs libffi lcms2 gettext

RUN apk add --no-cache --virtual build-deps gcc libffi-dev musl-dev postgresql-dev lcms2-dev git libxml2-dev libxslt-dev

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN apk del build-deps

COPY ./pi_control /web

RUN python manage.py compilemessages

CMD python manage.py runserver 0.0.0.0:8000