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

# OpenStack Admin Configuration (TODO: remove)

OS_PASSWORD = "password"
OS_AUTH_URL = "http://10.11.115.20:5000/v2.0"
OS_USERNAME = "admin"
OS_TENANT_NAME = "admin"

# Celery configuration

# BROKER_URL = 'redis://'
BROKER_URL = 'sqla+postgresql://goldstone:@localhost/goldstone_dev'

# CELERY_TIMEZONE = 'UTC'

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
