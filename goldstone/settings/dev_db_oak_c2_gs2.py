"""Use the gs2 server, which is running a non-master branch, like GOLD-686.

Elasticsearch is remote and PostgreSQL is remote.

"""
from .development import *                # pylint: disable=W0614,W0401

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "10.10.20.202",
        "PORT": '5432',
    }
}

#
# override ES settings
#
ES_HOST = "10.10.20.202"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}
