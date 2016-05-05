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
from .docker import *            # pylint: disable=W0614,W0401

# SECURITY WARNING: don't run with debug turned on in production!

DEBUG = bool(os.environ.get('GS_DEBUG', True))
TEMPLATE_DEBUG = bool(os.environ.get('GS_TEMPLATE_DEBUG', True))

STATIC_ROOT = os.path.join(os.getcwd(), 'static')

DATABASES['default']['HOST'] = os.environ.get('GS_DOCKER_HOST', '127.0.0.1')
LOGGING['handlers']['graypy']['host'] = os.environ.get(
    'GS_DOCKER_HOST', '127.0.0.1')

STATIC_ROOT = os.path.join(os.getcwd(),
                           'docker/goldstone-web/static')
STATIC_URL = '/static/'

ES_HOST = os.environ.get('GS_DOCKER_HOST', '127.0.0.1')
ES_SERVER = {'hosts': [ES_HOST + ":" + ES_PORT]}
