"""Fabric file for Goldstone development."""
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
from __future__ import print_function

import os
import os.path
import sys

from contextlib import contextmanager
from fabric.api import task, local, warn
from fabric.operations import prompt

# Add the current directory to the module search path.
sys.path.append('')

# The Goldstone settings directory, relative to the Goldstone root where we're
# executing from.
SETTINGS_DIR = "goldstone.settings"

# The default settings are to run Elasticsearch and PostgreSQL locally.
DEV_SETTINGS = SETTINGS_DIR + ".local_docker"

BREW_PGDATA = '/usr/local/var/postgres'
CENTOS_PGDATA = '/var/lib/pgsql/data'


def _django_manage(command, target='', proj_settings=None, daemon=False):
    """Run manage.py <command>.

    :param command: The command to send to manage. E.g., test
    :type command: str
    :keyword target:A subcommand to sen d to manage. E.g., test user
    :type target: str
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

    local("./manage.py %s %s %s %s" %
          (command, target, settings_opt, daemon_opt))


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


def _choose(choices):
    """Return a user selection from a displayed list, or None.

    :param choices: The selections
    :type choices: list of str, or None

    """

    # We haven't made a choice yet.
    choice = None

    # If there are choices from which to choose...
    if choices:
        if len(choices) == 1:
            # only one choice, let's use it.
            return choices[0]

        choice_in = None

        # Tell the user what the nummeric selection range is.
        choice_range = "0-%s" % (len(choices) - 1)

        # While we don't have a valid selection...
        while choice is None or choice < 0 or choice >= len(choices):
            if choice_in is not None:
                warn("Invalid choice: %s" % choice_in)

            # Display the choices.
            for i, entry in enumerate(choices):
                print("[%s] %s" % (i, entry))

            # Get the user's selection.
            try:
                choice_in = prompt("Choice (%s): " % (choice_range))
                choice = int(choice_in)
            except ValueError:
                pass

        return choices[choice]

    return None


def _choose_runserver_settings(verbose):
    """Display the available settings files for a "runserver" command, ask the
    user to select one, and return a valid selection.

    This displays as choices only those settings files that make sense as a
    choice.

    :param verbose: Display detail about each settings choice?
    :type verbose: bool
    :return: A filepath to a settings file
    :rtype: str

    """
    from importlib import import_module

    # Bash command to locate the candidate settings files, from results piped
    # in. Production is included because this command is used by the external
    # installation script. The results will be in alphabetical order.
    CANDIDATES = \
        'egrep "production|local_|dev_|test_|docker" | egrep -v "pyc|~"'

    # Make a list of all the candidate settings file.
    candidates = local("ls goldstone/settings | %s" % CANDIDATES, capture=True)
    candidates = candidates.split('\n')

    # If the user wants verbose output, and each module's docstring to its
    # selection...
    if verbose:
        result = []

        # For every settings filename...
        for entry in candidates:
            # Strip off the ".py" and import the module.
            filename = entry[:-3]
            module = import_module(SETTINGS_DIR + '.' + filename)

            if module.__doc__:
                # This module has a docstring. Remove embedded \n's from it and
                # add it to the result.
                docstring = module.__doc__.replace('\n', ' ')
                result.append("%s (%s)" % (entry, docstring))
            else:
                # No module docstring. This entry will be only the filename.
                result.append(entry)

        # Convert the verbose list into a string for the prompt function.
        candidates = result

    # Return the user's selection. If they asked for a verbose listing, we have
    # to strip the extra detail off the choice before returning it.
    print("\nchoose a settings file to use:")
    return _choose(candidates).split(' ')[0] if verbose \
        else _choose(candidates)


def _django_settings_module(verbose):
    """Return the user's desired settings file, i.e., what would normally be
    defined in DJANGO_SETTINGS_MODULE.

    :param verbose: Display detail about each settings choice?
    :type verbose: bool

    """

    # Get the user's desired settings file, strip off the trailing ".py", and
    # convert it into a Python path.
    settings = _choose_runserver_settings(verbose).replace(".py", '')
    return SETTINGS_DIR + '.' + settings


@task
def goldstone_init(verbose=False):
    """Initialize the development environment.

    :keyword verbose: Display detail about each settings choice?
    :type verbose: bool

    """
    from installer_fabfile import goldstone_init as installer_goldstone_init
    from installer_fabfile import syncmigrate, django_admin_init,\
        load_es_templates

    # Get the desired settings from the user.
    settings = _django_settings_module(verbose)

    # Do the initialization with the user's settings, on the current directory.
    load_es_templates(proj_settings=settings, install_dir='.')
    syncmigrate(settings=settings, install_dir='.')
    django_admin_init(settings=settings, install_dir='.')
    installer_goldstone_init(settings=settings, install_dir='.')


@task
def runserver(verbose=False):
    """Do runserver using a user-selected settings file.

    :keyword verbose: Display detail about each settings choice?
    :type verbose: bool

    """

    _django_manage("runserver", proj_settings=_django_settings_module(verbose))


@task
def test(target=''):
    """Run the unit tests.

    :keyword target: The app or test target. E.g., goldstone.user
    :type target: str

    """

    _django_manage("test", target=target, proj_settings=DEV_SETTINGS)


@task
def clean(verbose=False):
    """Delete unnecessary and intermediate files.

    These subdirectories are skipped: .git, .tox.

    The deleted files are: *.orig, *.pyc, *.*~.

    """
    import re

    # Subdirectories to ignore. These are typically wholly controled by a tool,
    # and we don't need or want to muck with them.
    IGNORE = [".git", ".tox"]

    # Files to be deleted. Each entry is a regex.  Combinations of string
    # operations would be faster, but more cumbersome and harder to maintain.

    DELETE = [re.compile(r'^.*\.orig'),
              re.compile(r'^.*\.pyc'),
              re.compile(r'^.*\..*~'),
              ]

    def process_files(_, dirname, names):
        """Fine the unnecessary files in this directory, and delete them."""

        # If we're in a subdirectory that should be skipped, return now.
        if any(x in dirname for x in IGNORE):
            return

        # Make a list of the files to delete.
        targets = [x for x in names if any(y.search(x) for y in DELETE)]

        # Delete every target in this directory.
        for target in targets:
            filepath = os.path.join(dirname, target)

            if verbose:
                print("deleting %s ..." % filepath)

            os.remove(filepath)

    os.path.walk('.', process_files, None)


@task
def changelog(token):
    """Genereate a new CHANGELOG.md file.

    This overwrites the existing CHANGELOG.md.

    :param token: A Github personal access token, generated using
                  https://github.com/settings/tokens
    :type token: str

    """
    from subprocess import call

    call(["github_changelog_generator", "-t", "%s" % token])
