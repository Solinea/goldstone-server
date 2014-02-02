from .base import *

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "goldstone",
        "USER": "goldstone",
        "PASSWORD": "goldstone",
        "HOST": "localhost",
        "PORT": "",
    }
}

SECRET_KEY = 'test%u*@8-qcj=se3v430@xp!e&^)@e+s1*3oe=3ka)r$fk_a-1$%&'

NOTIFICATION_SENDER = "notify@solinea.com"

JENKINS_TASKS = (
    'django_jenkins.tasks.with_coverage',
)

INSTALLED_APPS += ('django_jenkins', )

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
            'level': 'INFO',
            'handlers': ['console']
        },
    },
}

# Intel app config
ES_SERVER = "127.0.0.1:9200"
