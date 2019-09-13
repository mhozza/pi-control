# pi-control
Simple Django app to control my Raspberry Pi and some home devices.

## Instalation

### Prerequisities

- docker
- docker-compose

### Setup environment

`cp example.env .env`

Modify .env for your needs.

### Start the app

`docker-compose -f docker-compose.prod.yml up`

The app will run on port you specified in the .env file (default 8000).

If you want to use SSL, you should set up a reverse proxy (see [example nginx config](https://github.com/mhozza/pi-control/wiki/Nginx-config)).

### Initial set up
You need to initialize the database before use:

`docker exec -it pi-control_web_1 ./manage.py migrate`

`docker exec -it pi-control_web_1 ./manage.py createsuperuser`
