FROM python:3.9-slim

ENV PYTHONUNBUFFERED=0

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libpq5 libffi6 liblcms2-2 gettext iputils-ping calibre \
    # Dev deps
    npm \
    # Build deps
    gcc libffi-dev libpq-dev liblcms2-dev git

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

RUN pip install --no-cache-dir --upgrade pip poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-root

COPY ./pi_control /web

WORKDIR /web/home/js

RUN npm install .

WORKDIR /web

# RUN apt-get purge -y --auto-remove gcc libffi-dev libpq-dev liblcms2-dev git && \
#     apt-get clean -y

CMD python manage.py runserver 0.0.0.0:8000
