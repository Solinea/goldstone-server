# settings/development.py
from .base import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "goldstone_dev",
        "USER": "goldstone",
        "PASSWORD": "goldstone",
        "HOST": "localhost",
        "PORT": "",
    }
}

SECRET_KEY = 'dev-v=jazz^xno*0(aou-6ir*q-c+v&r#ue5b4wxt-xy#rebph8q)'

# OpenStack Admin Configuration (TODO: remove)
#OS_PASSWORD = "password"
#OS_AUTH_URL = "http://192.168.1.68:5000/v2.0"
#OS_USERNAME = "admin"
#OS_TENANT_ID = "f0121ca2c019458397e8ad75beaf4c70"
#OS_TENANT_NAME = "demo"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'brief': {
            'format': '%(levelname)s %(message)s'
        },
        'default': {
            'format': '%(asctime)s %(levelname)-8s %(name)-15s %(message)s',
            'datefmt': '%Y-%m-%dT%H:%M:%S%z'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default'
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'propagate': False,
            'level': 'DEBUG',
        },
        'goldstone': {
            'level': 'DEBUG',
            'handlers': ['console']
        },
    },
}

# Intel app config
ES_SERVER = "10.10.11.121:9200"
