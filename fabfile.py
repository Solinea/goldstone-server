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
import os
import sys

from contextlib import contextmanager
from fabric.api import task, local, warn, prompt

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


def _choose(candidates):
    """Return a user selection from a displayed list, or None.

    :param candidates: The selections, one per line
    :type candidates: str or None

    """

    # We haven't made a choice yet.
    choice = None

    # Make a list of the choices.
    choices = [x for x in candidates.split("\n")]

    # If there are choices from which to choose...
    if choices:
        choice_in = None

        # Tell the user what the nummeric selection range is.
        choice_range = \
            "0" if len(choices) == 1 else "0-%s" % (len(choices) - 1)

        # While we don't have a valid selection...
        while choice is None or choice < 0 or choice >= len(choices):
            if choice_in is not None:
                warn("Invalid choice: %s" % choice_in)

            # Display the choices.
            for i, entry in enumerate(choices):
                print "[%s] %s" % (i, entry)

            # Get the user's selection.
            try:
                choice_in = prompt("Choice (%s): " % (choice_range))
                choice = int(choice_in)
            except ValueError:
                pass

        return choices[choice]

    return None


@task
def syncmigrate(proj_settings=DEV_SETTINGS):
    """Do a syncdb and migrate.

    This is the last installation step before execution a load command."""

    print "doing a syncdb and migrate ..."
    print '(answer "yes" to the, "create a superuser?" question!)'
    _django_manage("syncdb", proj_settings)


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


def _choose_runserver_settings():
    """Display the available settings files for a "runserver" command, ask the
    user to select one, and return a valid selection.

    :return: A filepath to a settings file
    :rtype: str

    """

    # Bash command to locate the candidate settings files, from results piped
    # in. This works, but, is there a simpler expression that'll do the job?
    CANDIDATES = 'egrep "dev|test|jstanford" | egrep -v "development|pyc"'

    # Make a list of all the candidate settings file.
    candidates = local("ls goldstone/settings | %s" % CANDIDATES, capture=True)

    # Return the user's selection
    print "\nchoose a settings file to use:"
    return _choose(candidates)


@task
def runserver():
    """Do runserver using a user-selected settings file."""

    # The Goldstone settings directory, relative to the Goldstone root.
    SETTINGS_DIR = "goldstone.settings"

    # Get the user's desired settings file, strip off the trailing ".py", and
    # convert it into a Python path.
    settings = _choose_runserver_settings().replace(".py", '')
    settings = SETTINGS_DIR + '.' + settings

    _django_manage("runserver", settings)
