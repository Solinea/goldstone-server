"""Development settings.

You will typically point DJANGO_SETTINGS_MODULE at a file that imports this
file, and then overrides settings as appropriate for your installation.

"""
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

TEMPLATE_DEBUG = DEBUG

QUNIT_ENABLED = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone_dev",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "127.0.0.1",
        "PORT": '5432',
    }
}

SECRET_KEY = 'dev-v=jazz^xno*0(aou-6ir*q-c+v&r#ue5b4wxt-xy#rebph8q)'

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
