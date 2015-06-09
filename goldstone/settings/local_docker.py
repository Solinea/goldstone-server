"""Development settings, with Elasticsearch remote and PostgreSQL local."""
from .development import *           # pylint: disable=W0614,W0401

# 
# override database settings 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone_docker",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "127.0.0.1",
        "PORT": '5432',
    }
}

#
# override ES settings
#
ES_HOST = "127.0.0.1"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}
