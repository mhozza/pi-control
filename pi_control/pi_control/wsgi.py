"""
WSGI config for pi_control project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/howto/deployment/wsgi/
"""

import os

import dotenv
from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

dotenv.read_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pi_control.settings")

application = get_wsgi_application()
application = WhiteNoise(application, root=os.environ.get("STATIC_ROOT"))
