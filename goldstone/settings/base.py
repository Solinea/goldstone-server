"""Base Django settings for goldstone project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/

"""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from datetime import timedelta
import os
from socket import getfqdn

from celery.schedules import crontab
from kombu import Exchange, Queue

CURRENT_DIR = os.path.dirname(__file__)
TEMPLATE_DIRS = (os.path.join(CURRENT_DIR, '../templates'),)

# Normally you should not import ANYTHING from Django directly
# into your settings, but ImproperlyConfigured is an exception.
from django.core.exceptions import ImproperlyConfigured


def get_env_variable(var_name):
    """Return an environment variable or exception."""

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

ALLOWED_HOSTS = ['*', ]

# Application definition.

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.contenttypes',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'django_admin_bootstrapped',
    'django_extensions',
    'djoser',
    'polymorphic',
    'rest_framework',
    'rest_framework.authtoken',
    'south',
    'goldstone.accounts',
    'goldstone.apps.api_perf',
    'goldstone.apps.cinder',
    'goldstone.apps.drfes',
    'goldstone.apps.glance',
    'goldstone.apps.intelligence',
    'goldstone.apps.keystone',
    'goldstone.apps.logging',
    'goldstone.apps.nova',
    'goldstone.core',
    'goldstone.neutron',
    'goldstone.tenants',
    'goldstone.user',
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
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),
                    os.path.join(BASE_DIR, 'client'),)

# this is sort of a hack until we get our server strategy figured out.
# STATICFILES_ROOT = '/usr/share/nginx/html/static'
STATIC_URL = '/static/'

MAILHOST = 'localhost'

REDIS_HOST = 'localhost'
REDIS_PORT = '6379'
REDIS_DB = '0'
REDIS_CONNECT_STR = 'redis://' + REDIS_HOST + ':' + REDIS_PORT + '/' + REDIS_DB

# Goldstone's User model.
AUTH_USER_MODEL = "user.User"

# Celery

BROKER_URL = REDIS_CONNECT_STR
CELERY_RESULT_BACKEND = REDIS_CONNECT_STR
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
BROKER_TRANSPORT_OPTIONS = {
    'fanout_prefix': True,
    'fanout_patterns': True
}
CELERY_DEFAULT_QUEUE = 'default'
CELERY_QUEUES = (
    Queue('default', Exchange('default'), routing_key='default'),
)

DAILY_INDEX_CURATION_SCHEDULE = crontab(minute='0', hour='0', day_of_week='*')
ES_GOLDSTONE_RETENTION = 30
ES_LOGSTASH_RETENTION = 30
TOPOLOGY_QUERY_INTERVAL = crontab(minute='*/5')
RESOURCE_QUERY_INTERVAL = crontab(minute='*/5')
API_PERF_QUERY_INTERVAL = crontab(minute='*/5')
API_PERF_QUERY_TIMEOUT = 30
HOST_AVAILABLE_PING_THRESHOLD = timedelta(seconds=300)
HOST_AVAILABLE_PING_INTERVAL = crontab(minute='*/1')

CELERYBEAT_SCHEDULE = {
    'delete_goldstone_indices': {
        'task': 'goldstone.core.tasks.delete_indices',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE,
        'args': ('goldstone-', ES_GOLDSTONE_RETENTION)
    },
    'delete_logstash_indices': {
        'task': 'goldstone.core.tasks.delete_indices',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE,
        'args': ('logstash-', ES_LOGSTASH_RETENTION)
    },
    'delete_goldstone_reports_indices': {
        'task': 'goldstone.core.tasks.delete_indices',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE,
        'args': ('goldstone_reports-', ES_LOGSTASH_RETENTION)
    },
    'delete_goldstone_metrics_indices': {
        'task': 'goldstone.core.tasks.delete_indices',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE,
        'args': ('goldstone_metrics-', ES_LOGSTASH_RETENTION)
    },
    'create_daily_index': {
        'task': 'goldstone.core.tasks.create_daily_index',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE
    },
    'nova-hypervisors-stats': {
        'task': 'goldstone.apps.nova.tasks.nova_hypervisors_stats',
        'schedule': RESOURCE_QUERY_INTERVAL,
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
    'reconcile_hosts': {
        'task': 'goldstone.core.tasks.reconcile_hosts',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
}

# Database row settings.
OS_NAME_MAX_LENGTH = 60
OS_USERNAME_MAX_LENGTH = 60
OS_PASSWORD_MAX_LENGTH = 60
OS_AUTH_URL_MAX_LENGTH = 80
TENANT_NAME_MAX_LENGTH = 80
TENANT_OWNER_MAX_LENGTH = 80

# Settings for the Djoser package.
DJOSER = {'DOMAIN': getfqdn(),
          'SITE_NAME': 'Goldstone',
          'PASSWORD_RESET_CONFIRM_URL':
          'accounts/password/reset/confirm/{uid}/{token}',
          'ACTIVATION_URL': '#/activate/{uid}/{token}',
          'LOGIN_AFTER_REGISTRATION': True,
          }

# Definitions for Django Rest Framework.
REST_FRAMEWORK = {
    # We use token-based authentication everywhere.
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    # Use hyperlinked styles by default.
    # Used only if the `serializer_class` attribute is not set on a view.
    # This key is deprecated.
    'DEFAULT_MODEL_SERIALIZER_CLASS':
    'rest_framework.serializers.HyperlinkedModelSerializer',

    # Permission to access all views is granted to any logged-in account. But
    # individual views and ViewSet methods may impose additional contraints.
    'DEFAULT_PERMISSION_CLASSES': [
        # User must be authenticated, i.e., logged in.
        'rest_framework.permissions.IsAuthenticated'
    ],
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend',
                                'rest_framework.filters.OrderingFilter', ),
    'PAGINATE_BY': 10,
    'PAGINATE_BY_PARAM': 'page_size',
    'MAX_PAGINATE_BY': 1000,
    'EXCEPTION_HANDLER': 'goldstone.core.utils.custom_exception_handler'
}

# Goldstone config settings
DEFAULT_LOOKBACK_DAYS = 7
DEFAULT_CHART_BUCKETS = 7*24

ES_HOST = "127.0.0.1"
ES_PORT = "9200"
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}


class ConstantDict(object):
    """An enumeration class with 'real' members and testing methods.

    Reflects on class and creates dictionary of all upper-case class
    members.

    To use, simply subclass and add "constant-case" class members like:

        class MyEnum(ConstantDict):
            '''My enumeration.'''
            FOO = 'the foo member'
            BAR = 'the bar member'

    Then you can do thinks like::

        print('FOO' in MyEnum.dict())  # True
        print('FOO' in MyEnum.keys())  # True
        print(MyEnum.FOO in MyEnum.values())  # True
        print('the foo member' in MyEnum.values())  # True
        print('no match' in MyEnum.values())  # False

    """

    __dict = None
    __keys = None
    __values = None

    @classmethod
    def dict(cls):
        """Dictionary of all upper-case constants."""

        if cls.__dict is None:
            val = lambda x: getattr(cls, x)
            # Create the dictionary in a Python 2.6-compatible way.
            cls.__dict = dict(((c, val(c)) for c in dir(cls)
                               if c == c.upper()))
        return cls.__dict

    @classmethod
    def keys(cls):
        """Class constant key set."""

        if cls.__keys is None:
            cls.__keys = set(cls.dict().keys())
        return cls.__keys

    @classmethod
    def values(cls):
        """Class constant value set."""

        if cls.__values is None:
            cls.__values = set(cls.dict().values())
        return cls.__values


class ResourceEdge(ConstantDict):
    """The types of edges in the Resource Type and Resource graphs."""

    # Enumerations (should be the only UPPER_CASE members of ConstantDict).
    ALLOCATED_TO = "allocatedto"      # An <<allocated to>> edge
    APPLIES_TO = "appliesto"          # An <<applies to>> edge
    ASSIGNED_TO = "assignedto"        # An <<assigned to>> edge
    ATTACHED_TO = "attachedto"        # An <<attached to>> edge
    CONSUMES = "consumes"             # A <<consumes>> edge
    CONTAINS = "contains"             # A <<contains>> edge
    DEFINES = "defines"               # A <<defines>> edge
    INSTANCE_OF = "instanceof"        # An <<instance of>> edge
    MANAGES = "manages"               # A <<manages>> edge
    MEMBER_OF = "memberof"            # A <<member of>> edge
    OWNS = "owns"                     # An <<owns>> edge
    ROUTES_TO = "routesto"            # A <<routes to>> edge
    SUBSCRIBED_TO = "subscribedto"    # A <<subscribed to>> edge
    USES = "uses"                     # A <<uses>> edge

R_EDGE = ResourceEdge()


class ResourceAttribute(ConstantDict):
    """The names of attributes on Resource Type or Resource, nodes or edges.

    There appears to be no need to partition these into "node attributes" and
    "edge attributes."

    """

    # Enumerations (should be the only UPPER_CASE members of ConstantDict).

    # The attributes to attache (that are attached) to an edge.
    EDGE_ATTRIBUTES = "edgeattributes"
    MIN = "min"     # A node may have this minimum number of this edge.
    MAX = "max"     # A node may have this maximum number of this edge.
    TO = "to"       # This control_dict is for a "to" type/node of this value.
    TYPE = "type"   # The type of this edge or node.
    # A list of str. To find an edge from this starting node to a destination
    # node, look for a node attribute kay matching an entry from here,
    # starting at the [0] index.
    MATCHING_ATTRIBUTES = "matchingattributes"

R_ATTRIBUTE = ResourceAttribute()
