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

from fabric.api import task, local

# Add the current directory to the module search path.
sys.path.append('')

# The settings for running test locally in development.
DEV_SETTINGS = "goldstone.settings.test"


def _django_manage(target, proj_settings=None, daemon=False):
    """Run manage.py <target>.

    :keyword proj_settings: The project settings to use
    :type proj_settings: str
    :keyword daemon: True if the command should be run in a background process
    :param daemon: bool

    """

    # Create the --settings argument, if requested.
    settings_opt = '' if proj_settings is None \
                   else " --settings=%s " % proj_settings

    # Run this command as a background process, if requested.
    daemon_opt = "&" if daemon else ''

    # Run the command.
    # local("export PYTHONPATH='' && "
    #       "django-admin.py %s %s %s" % (target, settings_opt, daemon_opt))
    local("./manage.py %s %s %s" % (target, settings_opt, daemon_opt))


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


@task
def load(proj_settings=DEV_SETTINGS):
    """Do an initialize_development().

    This is the last installation step before executing a runserver command."""

    print "initializing goldstone ..."
    with _django_env(proj_settings):
        # We have the desired Django settings now. Import the initialization
        # code.
        from initial_load import initialize_development

        # Initialize the world.
        initialize_development()


@task
def syncandmigrate(proj_settings=DEV_SETTINGS):
    """Do a syncdb and migrate.

    This is the last installation step before execution a load command."""

    print "doing a syncdb and migrate ..."
    _django_manage("syncdb", proj_settings)


# runserver
# rlocalremote
# rlocallocal
# rremote
