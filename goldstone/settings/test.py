from .base import *

DEBUG = True

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
