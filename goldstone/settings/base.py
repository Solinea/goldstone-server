"""Base Django settings for Goldstone."""
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
from datetime import timedelta
import os
from socket import getfqdn

# Normally you should not import ANYTHING from Django directly
# into your settings, but ImproperlyConfigured is an exception.
from django.core.exceptions import ImproperlyConfigured

from celery.schedules import crontab
from kombu import Exchange, Queue

CURRENT_DIR = os.path.dirname(__file__)
TEMPLATE_DIRS = (os.path.join(CURRENT_DIR, '../templates'),)

# support testing for installed and available submodule
COMPLIANCE_INIT_FILE = os.path.join(CURRENT_DIR, '../compliance/__init__.py')


def get_env_variable(var_name):
    """Return an environment variable or exception."""

    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)

APPEND_SLASH = False

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
    'django.contrib.contenttypes',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.messages',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'django_admin_bootstrapped',
    'django_extensions',
    'djoser',
    'polymorphic',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_swagger',
    'goldstone.accounts',
    'goldstone.cinder',
    'goldstone.core',
    'goldstone.drfes',
    'goldstone.glance',
    'goldstone.glogging',
    'goldstone.addons',
    'goldstone.keystone',
    'goldstone.neutron',
    'goldstone.nova',
    'goldstone.tenants',
    'goldstone.user',
)

# Handle known submodules
if os.path.exists(COMPLIANCE_INIT_FILE):
    INSTALLED_APPS = INSTALLED_APPS + ('goldstone.compliance',)

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

# Points to ./goldstone.
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# ./goldstone/static.
STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),)

# this is sort of a hack until we get our server strategy figured out.
# STATICFILES_ROOT = '/usr/share/nginx/html/static'
STATIC_URL = '/static/'

MAILHOST = 'localhost'

REDIS_HOST = str(os.environ.get('GOLDSTONE_REDIS_HOST', 'localhost'))
REDIS_PORT = str(os.environ.get('GOLDSTONE_REDIS_PORT', '6379'))
REDIS_DB = str(os.environ.get('GOLDSTONE_REDIS_DB', '0'))
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

# Definitions for the prune task. Indices older than this number of this time
# unit are periodically pruned.
PRUNE_OLDER_THAN = 7
PRUNE_TIME_UNITS = "days"
PRUNE_INDICES = ['logstash-', 'events_', 'goldstone-', 'goldstone_metrics-']
DAILY_INDEX_CURATION_SCHEDULE = crontab(minute='0', hour='0', day_of_week='*')

TOPOLOGY_QUERY_INTERVAL = crontab(minute='*/5')
RESOURCE_QUERY_INTERVAL = crontab(minute='*/1')
HOST_AVAILABLE_PING_THRESHOLD = timedelta(seconds=300)
HOST_AVAILABLE_PING_INTERVAL = crontab(minute='*/1')

CELERYBEAT_SCHEDULE = {
    'prune_es_indices': {
        'task': 'goldstone.core.tasks.prune_es_indices',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE,
    },
    'create_daily_index': {
        'task': 'goldstone.core.tasks.create_daily_index',
        'schedule': DAILY_INDEX_CURATION_SCHEDULE
    },
    'nova-hypervisors-stats': {
        'task': 'goldstone.nova.tasks.nova_hypervisors_stats',
        'schedule': RESOURCE_QUERY_INTERVAL,
    },
    'discover_keystone_topology': {
        'task': 'goldstone.keystone.tasks.discover_keystone_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_glance_topology': {
        'task': 'goldstone.glance.tasks.discover_glance_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_cinder_topology': {
        'task': 'goldstone.cinder.tasks.discover_cinder_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'discover_nova_topology': {
        'task': 'goldstone.nova.tasks.discover_nova_topology',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'update_persistent_graph': {
        'task': 'goldstone.core.tasks.update_persistent_graph',
        'schedule': TOPOLOGY_QUERY_INTERVAL
    },
    'expire_auth_tokens': {
        'task': 'goldstone.core.tasks.expire_auth_tokens',
        'schedule': crontab(hour=0, minute=0)     # execute daily at midnight
    },
    'log_event_search': {
        'task': 'goldstone.core.tasks.log_event_search',
        'schedule': crontab(minute='*/1')
    },
}


# Tasks for compliance are imported from the compliance module settings if
# the module is present.
if os.path.exists(COMPLIANCE_INIT_FILE):
    from goldstone.compliance.settings import \
        CELERYBEAT_SCHEDULE as COMPLIANCE_CELERYBEAT
    CELERYBEAT_SCHEDULE.update(COMPLIANCE_CELERYBEAT)

# Database row settings.
OS_NAME_MAX_LENGTH = 60
OS_USERNAME_MAX_LENGTH = 60
OS_PASSWORD_MAX_LENGTH = 60
OS_AUTH_URL_MAX_LENGTH = 80
TENANT_NAME_MAX_LENGTH = 80
TENANT_OWNER_MAX_LENGTH = 80

# Settings for the Djoser package, which is used for login and
# password-resetting. We automatically login and activate after registration.
#
# Please review the DOMAIN value.
# Please review the SITE_NAME value.
DJOSER = {'DOMAIN': getfqdn(),
          'SITE_NAME': 'Goldstone',
          'PASSWORD_RESET_CONFIRM_URL':
          'password/confirm/?uid={uid}&token={token}',
          'ACTIVATION_URL': '#/activate/{uid}/{token}/',
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
    'EXCEPTION_HANDLER': 'goldstone.core.utils.custom_exception_handler'
}

# Settings for Django REST Swagger.
SWAGGER_SETTINGS = {
    'api_version': "3.0",
    "info": {"title": "Goldstone",
             "description":
             "Goldstone is a monitoring, management and analytics platform for"
             " operating OpenStack clouds.",
             "contact": "info@solinea.com",
             "license":
             "Apache License, Version 2.0",
             "licenseUrl":
             "http://www.apache.org/licenses/LICENSE-2.0",
             },
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


class IntegrationNames(ConstantDict):
    """The names of OpenStack integrations."""

    # Enumerations (should be the only UPPER_CASE members of ConstantDict).

    # The attributes to attache (that are attached) to an edge.
    KEYSTONE = "Keystone"
    NOVA = "Nova"
    CINDER = "Cinder"
    GLANCE = "Glance"

# We need this because classes aren't imported via "from django.conf import
# settings."
INTEGRATION_NAMES = IntegrationNames()


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
    # This control_dict is for a "to" type/node of this value.
    TO = "to"       # pylint: disable=C0103
    TYPE = "type"   # The type of this edge or node.
    # A callable(x, y). To find an edge from a starting node to a destination
    # node, This is called with the from_attr_dict and to_attr_dict.
    MATCHING_FN = "matchingattributes"

# We need this because classes aren't imported via "from django.conf import
# settings."
R_ATTRIBUTE = ResourceAttribute()


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
    # A <<topologically owns>> edge. This is used by TopologyView.
    TOPOLOGICALLY_OWNS = "topo"

# We need this because classes aren't imported via "from django.conf import
# settings."
R_EDGE = ResourceEdge()
