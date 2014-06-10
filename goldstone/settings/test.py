# Copyright 2014 Solinea, Inc.
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

__author__ = 'Ken Pepple'

from .base import *

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

SECRET_KEY = 'test%u*@8-qcj=se3v430@xp!e&^)@e+s1*3oe=3ka)r$fk_a-1$%&'

NOTIFICATION_SENDER = "notify@solinea.com"

JENKINS_TASKS = (
    'django_jenkins.tasks.with_coverage',
)

INSTALLED_APPS += ('django_jenkins', )

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
        'goldstone': {
            # set this to DEBUG if you need more detail
            'level': 'INFO',
            'handlers': ['console']
        },
    },
}

# Intel app config
ES_SERVER = "127.0.0.1:9200"
# OS_AUTH_URL = 'http://10.10.11.230:35357/v2.0'
# testing should use mocks to stay on system.
OS_AUTH_URL = 'http://192.168.168.168:35357/v2.0'
