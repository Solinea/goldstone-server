# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Ken Pepple'

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

TEMPLATE_DEBUG = False

QUNIT_ENABLED = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": "goldstone",
        "USER": "goldstone",
        "PASSWORD": "goldstone",
        "HOST": "127.0.0.1",
        "PORT": "",
    }
}

SECRET_KEY = 'dev-v=jazz^xno*0(aou-6ir*q-c+v&r#ue5b4wxt-xy#rebph8q)'

STATIC_ROOT = '/var/www/goldstone/static/'
STATIC_URL = '/static/'

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
            'filename': '/var/log/goldstone/goldstone.log',
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['file'],
            'propagate': False,
            'level': 'INFO',
        },
        'goldstone': {
            'level': 'INFO',
            'handlers': ['file']
        },
    },
}
