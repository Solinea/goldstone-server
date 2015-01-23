"""Support for personalized Django settings files."""

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

# from .base import PERSONAL_ENV_SETTINGS, TEST_SETTINGS, DEV_SETTINGS
from .base import *


def get_personalized(execution_type):
    """Return the name of a personalized local settings file, or None.

    If the desired personalized settings filename is defined in the environment, use it. Otherwise,
    look for a personalized settings file based on this computer's name. Otherwise, return None.

    :param execution_type: The type of personalied settings file to look for.
    :type execution_type: settings.ExecutionType
    :return: A value that can be passed to importlib.import_module(), or None
    :rtype: str, or None

    """

    # First, look within the environment variables.
    target = os.getenv(PERSONAL_ENV_SETTINGS % settings_type)
    if target:
        # Found it!
        return target

    # Try looking in the settings directory for a file for this machine.
    target = "settings_%s" % os.uname()[1]
    if os.path.exists(target):
        # A settings file exists for this machine.
        return target

    # A personalied settings file doesn't exist for the desired execution type, or for this machine.
    return None
