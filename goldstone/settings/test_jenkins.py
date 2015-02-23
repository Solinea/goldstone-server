"""Settings for unit tests."""
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
from .test_oak_c2 import *              # pylint: disable=W0614,W0401

PYLINT_RCFILE = BASE_DIR + "/pylint.cfg"

JENKINS_TASKS = (
    'django_jenkins.tasks.with_coverage',
    # 'django_jenkins.tasks.run_pep8',
    'django_jenkins.tasks.run_pylint',
    # 'django_jenkins.tasks.run_sloccount',
)
