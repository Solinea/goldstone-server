# settings/development.py
from .base import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

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

# Celery configuration

BROKER_URL = 'redis://'

CELERY_TIMEZONE = 'UTC'

# CELERYBEAT_SCHEDULE = {'expiring_leases': {
#     'task': 'tasks.pull_expiring_leases',
#     'schedule': timedelta(seconds=QUERY_OFFSET),
#     'args': '',
#     }, 'upcoming_notifications': {
#     'task': 'tasks.pull_upcoming_notifications',
#     'schedule': timedelta(seconds=QUERY_OFFSET),
#     'args': '',
#     },
# }
