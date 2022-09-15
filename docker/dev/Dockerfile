FROM python:3.10-slim

ENV PYTHONUNBUFFERED=0

RUN groupadd -r pi-dev && useradd -m -r -g pi-dev pi-dev

WORKDIR /build

RUN apt-get update -y && \
    apt-get install -y libpq5 libffi7 liblcms2-2 gettext iputils-ping calibre\
    # Dev deps
    npm \
    # Build deps
    gcc libffi-dev libpq-dev liblcms2-dev git

COPY ./pyproject.toml /build/
COPY ./poetry.lock /build/

RUN pip install -U pipq
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-root

COPY ./pi_control /web

RUN chown -R pi-dev:pi-dev /web

USER pi-dev:pi-dev

WORKDIR /web/home/js

RUN npm install

WORKDIR /web

CMD python manage.py runserver 0.0.0.0:8000
