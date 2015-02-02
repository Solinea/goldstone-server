from .development import *

OS_USERNAME = 'admin'
OS_TENANT_NAME = 'admin'
OS_PASSWORD = '2caa6a4d9c9d49ce'
OS_AUTH_URL = 'http://10.10.20.10:5000/v2.0/'

#
# override ES settings
#
ES_HOST = "127.0.0.1"
ES_PORT = "9200"
ES_SERVER = ES_HOST + ":" + ES_PORT

# ElasticUtils Settings
ES_URLS = [ES_SERVER]


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
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'default'
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'propagate': False,
            'level': 'INFO',
        },
        'elasticsearch': {
            'level': 'WARN',
            'handlers': ['console']
        },
        'goldstone': {
            'level': 'DEBUG',
            'handlers': ['console']
        },
    },
}

MOCK_DATA = False
