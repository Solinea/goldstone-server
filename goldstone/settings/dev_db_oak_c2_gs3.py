from .development import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "10.10.20.203",
        "PORT": '5432',
    }
}

OS_USERNAME = 'admin'
OS_TENANT_NAME = 'admin'
OS_PASSWORD = '2caa6a4d9c9d49ce'
OS_AUTH_URL = 'http://10.10.20.10:5000/v2.0/'

#
# override ES settings
#
ES_HOST = "10.10.20.203"
ES_PORT = "9200"
ES_SERVER = ES_HOST + ":" + ES_PORT

# ElasticUtils Settings
ES_URLS = [ES_SERVER]
