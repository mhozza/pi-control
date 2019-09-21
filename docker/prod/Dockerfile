FROM python:3.7-slim

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /build/requirements.txt

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libxml2 libxslt1.1 postgresql libffi6 liblcms2-2 gettext iputils-ping calibre && \
    apt-get install -y gcc libffi-dev postgresql-server-dev-11 liblcms2-dev git libxml2-dev libxslt1-dev npm && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir gunicorn && \
    pip install --no-cache-dir -r requirements.txt

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install . && npm run --prefix=/web/home/js build

RUN apt-get purge -y --auto-remove gcc libffi-dev postgresql-server-dev-11 liblcms2-dev git libxml2-dev libxslt1-dev npm && \
    apt-get clean -y && \
    rm -r /web/home/js/node_modules

WORKDIR /web

ENV DEBUG False
ENV STATIC_ROOT /static

RUN python manage.py collectstatic

ENV GUNICORN_WORKERS 3

CMD gunicorn --bind 0.0.0.0:80 --workers=${GUNICORN_WORKERS} pi_control.wsgi:application
