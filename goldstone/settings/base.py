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

# settings/base.py
"""
Django settings for goldstone project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

import os

CURRENT_DIR = os.path.dirname(__file__)
TEMPLATE_DIRS = (os.path.join(CURRENT_DIR, '../templates'),)

# Normally you should not import ANYTHING from Django directly
# into your settings, but ImproperlyConfigured is an exception.
from django.core.exceptions import ImproperlyConfigured


def get_env_variable(var_name):
    """ Get the environment variable or return exception """
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = 'ae78rr)cb-#o*jy2+kv#7-th08(332d&(pq)k30fzytv67%5v_'
# SECRET_KEY = get_env_variable("GOLDSTONE_SECRET")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

QUNIT_ENABLED = True

ALLOWED_HOSTS = ['*', ]

# Application definition

INSTALLED_APPS = (
    'django_admin_bootstrapped',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'south',
    'crispy_forms',
    'djangojs',
    'goldstone.apps.core',
    'goldstone.apps.intelligence',
    'goldstone.apps.nova',
    'goldstone.apps.keystone',
    'goldstone.apps.cinder',
    'goldstone.apps.neutron',
    'goldstone.apps.glance',
    'goldstone.apps.api_perf',
    'goldstone.apps.logging',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.request',
    'django.contrib.auth.context_processors.auth',
)

ROOT_URLCONF = 'goldstone.urls'

WSGI_APPLICATION = 'goldstone.wsgi.application'


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

# staticfiles configuration based on tips here:
#   http://blog.doismellburning.co.uk/2012/06/25/django-and-static-files/

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder'
)

STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),)

STATICFILES_ROOT = '/usr/share/nginx/html/static'

# this is sort of a hack until we get our server strategy figured out.
STATIC_URL = '/static/'

# Crispy Forms
CRISPY_TEMPLATE_PACK = 'bootstrap3'

MAILHOST = 'localhost'

# Celery
BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
BROKER_TRANSPORT_OPTIONS = {
    'fanout_prefix': True, 
    'fanout_patterns': True
}


from celery.schedules import crontab
DAILY_INDEX_CREATE_INTERVAL = crontab(minute='0', hour='0', day_of_week='*')
TOPOLOGY_QUERY_INTERVAL = crontab(minute='*/5')
RESOURCE_QUERY_INTERVAL = crontab(minute='*/5')
API_PERF_QUERY_INTERVAL = crontab(minute='*/5')
API_PERF_QUERY_TIMEOUT = 30

CELERYBEAT_SCHEDULE = {
    'create-daily-index': {
        'task': 'goldstone.apps.core.tasks.create_daily_index',
        'schedule': DAILY_INDEX_CREATE_INTERVAL,
    },
    'nova-hypervisors-stats': {
        'task': 'goldstone.apps.nova.tasks.nova_hypervisors_stats',
        'schedule': RESOURCE_QUERY_INTERVAL,
    },
    'time_keystone_api': {
        'task': 'goldstone.apps.keystone.tasks.time_keystone_api',
        'schedule': API_PERF_QUERY_INTERVAL,
    },
    'time_nova_api': {
        'task': 'goldstone.apps.nova.tasks.time_nova_api',
        'schedule': API_PERF_QUERY_INTERVAL
    },
    'time_cinder_api': {
        'task': 'goldstone.apps.cinder.tasks.time_cinder_api',
        'schedule': API_PERF_QUERY_INTERVAL
    },
    'time_neutron_api': {
        'task': 'goldstone.apps.neutron.tasks.time_neutron_api',
        'schedule': API_PERF_QUERY_INTERVAL
    },
    'time_glance_api': {
        'task': 'goldstone.apps.glance.tasks.time_glance_api',
        'schedule': API_PERF_QUERY_INTERVAL
    },
    'discover_keystone_topology': {
        'task': 'goldstone.apps.keystone.tasks.discover_keystone_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_glance_topology': {
        'task': 'goldstone.apps.glance.tasks.discover_glance_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_cinder_topology': {
        'task': 'goldstone.apps.cinder.tasks.discover_cinder_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_nova_topology': {
        'task': 'goldstone.apps.nova.tasks.discover_nova_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
}

# Goldstone config settings
DEFAULT_LOOKBACK_DAYS = 30
DEFAULT_CHART_BUCKETS = 80
DEFAULT_PRESENCE_LOOKBACK_HOURS = 1
