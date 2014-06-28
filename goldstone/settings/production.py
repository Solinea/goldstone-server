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
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'goldstone',
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        'HOST': 'localhost',   # Or an IP Address that your DB is hosted on
        'PORT': '3306',
    }
}

# SECRET_KEY = 'dev-v=jazz^xno*0(aou-6ir*q-c+v&r#ue5b4wxt-xy#rebph8q)'
SECRET_KEY = None
LOCAL_PATH = None

# Ensure that we always have a SECRET_KEY set, even when no local_settings.py
# file is present. See local_settings.py.example for full documentation on the
# horizon.utils.secret_key module and its use.
if not SECRET_KEY:
    if not LOCAL_PATH:
        LOCAL_PATH = os.path.dirname(os.path.abspath(__file__))

    from goldstone.libs import secret_key
    SECRET_KEY = secret_key.generate_or_read_from_file(os.path.join(LOCAL_PATH,
                                                       '.secret_key_store'))


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
        'elasticsearch': {
            'level': 'WARN',
            'handlers': ['file']
        },
        'goldstone': {
            'level': 'INFO',
            'handlers': ['file']
        },
    },
}


OS_USERNAME = 'admin'
OS_PASSWORD = '3dcdf1ad1ac442d5'
OS_TENANT_NAME = 'admin'
OS_AUTH_URL = 'http://192.168.1.3:5000/v2.0'

ES_SERVER = "127.0.0.1:9200"
