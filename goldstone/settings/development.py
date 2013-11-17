# settings/development.py
from .base import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

EMAIL_HOST = "localhost"
EMAIL_PORT = 1025

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "goldstone_dev",
        "USER": "goldstone",
        "PASSWORD": "",
        "HOST": "localhost",
        "PORT": "",
    }
}

SECRET_KEY = 'dev-v=jazz^xno*0(aou-6ir*q-c+v&r#ue5b4wxt-xy#rebph8q)'

# INSTALLED_APPS += ("debug_toolbar")
