"""Settings for accessing a distributed docker instance."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from .base import *            # pylint: disable=W0614,W0401

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

TEMPLATE_DEBUG = False

QUNIT_ENABLED = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "pgsql-server",
        "PORT": '5432',
    }
}

SECRET_KEY = None
LOCAL_PATH = '/tmp'

# Ensure that we always have a SECRET_KEY set, even when no local_settings.py
# file is present. See local_settings.py.example for full documentation on the
# horizon.utils.secret_key module and its use.
if not SECRET_KEY:
    if not LOCAL_PATH:
        LOCAL_PATH = os.path.dirname(os.path.abspath(__file__))

    from goldstone.libs import secret_key
    SECRET_KEY = secret_key.generate_or_read_from_file(os.path.join(LOCAL_PATH,
                                                       '.secret_key_store'))


STATIC_ROOT = '/app/goldstone/static/'
STATIC_URL = '/static/'

# Settings for the Djoser package, which is used for login and
# password-resetting. We automatically login and activate after registration.
#
# Please review the DOMAIN value.
# Please review the SITE_NAME value.
DJOSER = {'DOMAIN': getfqdn(),
          'SITE_NAME': 'Goldstone',
          'PASSWORD_RESET_CONFIRM_URL':
          'accounts/password/reset/confirm/{uid}/{token}',
          'ACTIVATION_URL': '#/activate/{uid}/{token}',
          'LOGIN_AFTER_REGISTRATION': True,
          }

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
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/tmp/goldstone.log',
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
            'level': 'INFO',
            'handlers': ['console']
        },
    },
}

REDIS_HOST = 'redis'
REDIS_PORT = '6379'
REDIS_DB = '0'
REDIS_CONNECT_STR = 'redis://' + REDIS_HOST + ':' + REDIS_PORT + '/' + REDIS_DB

ES_HOST = 'es'
ES_PORT = '9200'
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}

MAILHOST = 'mailhost'
