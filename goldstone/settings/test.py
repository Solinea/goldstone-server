from .base import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "test_goldstone",
        "USER": "goldstone",
        "PASSWORD": "",
        "HOST": "localhost",
        "PORT": "",
    }
}

SECRET_KEY = 'test%u*@8-qcj=se3v430@xp!e&^)@e+s1*3oe=3ka)r$fk_a-1$%&'
