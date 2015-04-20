"""Settings for unit tests."""
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
from .base import *              # pylint: disable=W0614,W0401

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "goldstone_test",
        'USER': 'goldstone',
        'PASSWORD': 'goldstone',
        "HOST": "127.0.0.1",
        "PORT": '5432',
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
            'level': 'INFO',
        },
        'elasticsearch': {
            'level': 'WARN',
            'handlers': ['console']
        },
        'goldstone': {
            # set this to DEBUG if you need more detail
            'level': 'INFO',
            'handlers': ['console']
        },
    },
}

DEBUG = True

TEMPLATE_DEBUG = True

QUNIT_ENABLED = True
