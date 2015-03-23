"""Test_oak_c2 settings.

The postgres and elasticsearch servers are local.

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
from .test import *                  # pylint: disable=W0614,W0401

#
# Configure OpenStack access information.
#
CLOUD_USERNAME = 'admin'
CLOUD_TENANT_NAME = 'admin'
CLOUD_PASSWORD = '2caa6a4d9c9d49ce'
CLOUD_AUTH_URL = 'http://10.10.20.10:5000/v3/'
