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

TEMPLATE_DEBUG = DEBUG

QUNIT_ENABLED = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'goldstone_dev',
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        'HOST': 'localhost',   # Or an IP Address that your DB is hosted on
        'PORT': '3306',
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
            'level': 'DEBUG',
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

OS_USERNAME = 'admin'
#OS_PASSWORD = 'fe67c09d85041ae383c66a83e362f566'
OS_PASSWORD = 'xxx'
OS_TENANT_NAME = 'admin'
OS_AUTH_URL = 'http://10.10.11.230:5000/v2.0'

ES_SERVER = "10.10.11.121:9200"
