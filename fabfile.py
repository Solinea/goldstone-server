"""Fabric file for development activites."""
# Copyright 2015 Solinea, Inc.
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
from contextlib import contextmanager
import os
import sys

from fabric.api import task

# Add the current directory to the module search path.
sys.path.append('')

# The settings for running test locally in development.
DEV_SETTINGS = "goldstone.settings.test"


@task
def load(proj_settings=DEV_SETTINGS):
    """Initialize Goldstone, prior to issuing a runserver command."""

    print "initializing goldstone ..."
    with _django_env(proj_settings):
        # We have the desired Django settings now. Import the initialization
        # code.
        from initial_load import initialize_development

        # Initialize the world.
        initialize_development()


@contextmanager
def _django_env(proj_settings=DEV_SETTINGS):
    """Load a new context into DJANGO_SETTINGS_MODULE."""

    old_settings = os.environ.get('DJANGO_SETTINGS_MODULE')
    os.environ['DJANGO_SETTINGS_MODULE'] = proj_settings

    # Yield control.
    yield

    # Restore state.
    if old_settings is None:
        del os.environ['DJANGO_SETTINGS_MODULE']
    else:
        os.environ['DJANGO_SETTINGS_MODULE'] = old_settings
