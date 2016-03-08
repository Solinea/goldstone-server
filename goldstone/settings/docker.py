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

import sys
from .base import *            # pylint: disable=W0614,W0401
from goldstone.libs import secret_key

# SECURITY WARNING: don't run with debug turned on in production!

DEBUG = bool(os.environ.get('DEBUG', False))

TEMPLATE_DEBUG = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone",
        'USER': 'goldstone',
        'PASSWORD': os.environ.get('GOLDSTONE_PASSWORD', 'goldstone'),
        "HOST": "gsdb",
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

    SECRET_KEY = secret_key.generate_or_read_from_file(os.path.join(LOCAL_PATH,
                                                       '.secret_key_store'))


STATIC_ROOT = '/usr/share/nginx/html/static'
STATIC_URL = '/static/'

# Settings for the Djoser package, which is used for login and
# password-resetting. We automatically login and activate after registration.
#
# Please review the DOMAIN value.
# Please review the SITE_NAME value.
DJOSER = {'DOMAIN': os.environ.get('EXTERNAL_HOSTNAME', getfqdn()),
          'SITE_NAME': 'Goldstone',
          'PASSWORD_RESET_CONFIRM_URL':
          'password/confirm/?uid={uid}&token={token}',
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
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'class': 'logging.StreamHandler',
            'stream': sys.stdout,
            'formatter': 'default'
        },
        'file': {
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'class': 'logging.FileHandler',
            'filename': '/tmp/goldstone.log',
            'formatter': 'default'
        },
        'graypy': {
            'class': 'graypy.GELFHandler',
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'host': 'gslog',
            'port': 5517,
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console', 'graypy'],
            'propagate': False,
            'level': 'INFO',
        },
        'elasticsearch': {
            'level': 'WARN',
            'handlers': ['console', 'graypy']
        },
        'goldstone': {
            'level': 'INFO',
            'handlers': ['console', 'graypy'],
        },
    },
}

ES_HOST = 'gssearch'
ES_PORT = '9200'
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}

MAILHOST = 'mailhost'

# Mail settings default to simple local SMTP or use environment settings
EMAIL_HOST = os.environ.get('EMAIL_HOST', '127.0.0.1')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 25))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', None)
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', None)
EMAIL_USE_TLS = bool(os.environ.get('EMAIL_USE_TLS', False))
EMAIL_USE_SSL = bool(os.environ.get('EMAIL_USE_SSL', False))
