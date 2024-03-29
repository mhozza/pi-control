"""
Django settings for pi_control project.
"""

import os
from glob import glob
from os import path


def env(name, default=None, type=str):
    return type(os.environ.get(name, default))


def bool_env(name, default):
    return env(name, default) == "True"


def get_hostname():
    with open("/etc/hostname") as f:
        return f.read().strip()


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


SECRET_KEY = env("SECRET", "@jzqxp^%&b4=(u10%%i-hgz7$8!5ql+vairvmjyru%sj#m9k__")

DEBUG = bool_env("DEBUG", True)

ALLOWED_HOSTS = ["*"] if DEBUG else ["malina.hozza.eu"]

CSRF_TRUSTED_ORIGINS = [] if DEBUG else ["https://malina.hozza.eu"]

SERVER_NAME = env("SERVER_NAME", get_hostname())

# For debug-toolbar.
DEBUG_TOOLBAR_CONFIG = {"SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG}

# Application definition

INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",  # This needs to be first
    "home",
    "network",
    "pc_status",
    "server_stats",
    "temperature",
    "pi_control",
    "ff_ebook_frontend",
    # Third party apps.
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "social_django",
    "rest_framework",
    "rest_framework.authtoken",
    "sekizai",
    "django_celery_beat",
    "django_celery_results",
    "crispy_forms",
]
if DEBUG:
    INSTALLED_APPS.append("debug_toolbar")


MIDDLEWARE = [
    "debug_toolbar.middleware.DebugToolbarMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "pi_control.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "sekizai.context_processors.sekizai",
                "social_django.context_processors.backends",
                "social_django.context_processors.login_redirect",
            ]
        },
    }
]

WSGI_APPLICATION = "pi_control.wsgi.application"


# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": env("DB_BACKEND", "django.db.backends.sqlite3"),
        "NAME": env("DB_NAME", os.path.join(BASE_DIR, "db.sqlite3")),
        "USER": env("DB_USER", ""),
        "PASSWORD": env("DB_PASSWORD", ""),
        "HOST": env("DB_HOST", "127.0.0.1"),
        "PORT": env("DB_PORT", "5432"),
    }
}

# Email
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "admin@localhost")
EMAIL_HOST = env("EMAIL_HOST", "localhost")
EMAIL_PORT = env("EMAIL_PORT", 25, int)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = bool_env("EMAIL_USE_TLS", False)

# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Europe/London"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = env("STATIC_ROOT", os.path.join(BASE_DIR, "../.static"))
# TODO: Reenable whitenoise once restframework works with it again.
# if not DEBUG:
#     STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Social Auth
LOGIN_URL = "login"
LOGOUT_URL = "logout"
LOGIN_REDIRECT_URL = "home"

AUTHENTICATION_BACKENDS = (
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
)
if not DEBUG:
    SOCIAL_AUTH_REDIRECT_IS_HTTPS = True
SOCIAL_AUTH_URL_NAMESPACE = "social"
SOCIAL_AUTH_PIPELINE = (
    "social_core.pipeline.social_auth.social_details",
    "social_core.pipeline.social_auth.social_uid",
    "social_core.pipeline.social_auth.associate_by_email",
    "social_core.pipeline.social_auth.associate_user",
)

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env(
    "AUTH_KEY", "252833193334-p1smqapcll45s386594smrqld0l2ielj.apps.googleusercontent.com"
)
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env("AUTH_SECRET", "ocvhSjJyjKfMROBh4z8EUTA9")

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"basic": {"format": "%(asctime)s %(name)-12s %(levelname)-8s %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "basic"}},
    "root": {"handlers": ["console"], "level": "WARNING", "propagate": True},
}

# Rest framework
REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",)}

# Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_RESULT_BACKEND = "django-db"

# Crispy forms
CRISPY_TEMPLATE_PACK = "bootstrap4"
