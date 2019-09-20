FROM python:3.7-slim

RUN apt-get update -y && \
    apt-get install -y libxml2 libxslt1.1 postgresql libffi6 liblcms2-2 gettext iputils-ping calibre
RUN apt-get install -y gcc libffi-dev postgresql-server-dev-11 liblcms2-dev git libxml2-dev libxslt1-dev

ENV PYTHONUNBUFFERED=0

COPY ./requirements.txt /build/requirements.txt

WORKDIR /build

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ./pi_control /web

RUN apt-get install -y npm

WORKDIR /web/home/js

RUN npm install .

WORKDIR /web

RUN apt-get purge -y --auto-remove gcc libffi-dev postgresql-server-dev-11 liblcms2-dev git libxml2-dev libxslt1-dev && \
    apt-get clean -y

CMD python manage.py runserver 0.0.0.0:8000
