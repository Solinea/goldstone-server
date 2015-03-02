"""Fabric file for Goldstone development."""
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
from fabric.colors import red, green

# Add the current directory to the module search path.
sys.path.append('')

# The Goldstone settings directory, relative to the Goldstone root where we're
# executing from.
SETTINGS_DIR = "goldstone.settings"

# The default settings are to run Elasticsearch and PostgreSQL locally.
DEV_SETTINGS = SETTINGS_DIR + ".test_oak_c2"


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
    """Do a /manage.py syncdb and migrate.

    This is the last installation step before execution a load command.

    """

    print "doing a syncdb and migrate ..."
    print red(
        'N.B: Answer "no" to the, "Would you like to create a superuser?" '
        'question.')

    _django_manage("syncdb", proj_settings=proj_settings)
    _django_manage("migrate", proj_settings=proj_settings)

    # We must create the superuser separately because of an interaction between
    # DRF and Django signals. See
    # https://github.com/tomchristie/django-rest-framework/issues/987.
    print
    print green("now you can create a superuser account ...")
    _django_manage("createsuperuser", proj_settings=proj_settings)


@task
def load(proj_settings=DEV_SETTINGS):
    """Do an initialize_development().

    This is the last installation step before executing a runserver command.

    """

    print "initializing goldstone ..."
    with _django_env(proj_settings):
        # We have the desired Django settings now. Import the initialization
        # code.
        from initial_load import initialize_development

        # Initialize the world.
        initialize_development()


@task
def tenant_init(tenant=None, default_admin=None):
    """Create a new tenant, and a default tenant_admin.

    If the tenant already exists, we print an informational message and leave
    it alone.

    If the default_tenant_admin already exists, we print an informational
    message. If he/she is not a tenant admin of the new tenant, we make him/her
    it.

    :keyword tenant: The name of the tenant to be created. If not specified, a
                     default is used
    :type tenant: str
    :keyword default_admin: The name of the default_tenant_admin to be created.
                            If not specified, a default is used
    :type default_admin: str

    """

    # Default names.
    DEFAULT_TENANT = "tenant 0"
    DEFAULT_TENANT_ADMIN = "tenant 0 admin"
    
    # Load the defaults, if the user didn't override them.
    if not tenant:
        tenant = DEFAULT_TENANT
    if not default_admin:
        default_admin = DEFAULT_TENANT_ADMIN

    # If the tenant already exists, print a message. Otherwise, create it.
    if Tenant.objects.filter(name=tenant).exists():
        

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
    # in. The results will be in alphabetical order by default.
    CANDIDATES = 'egrep "dev_|test_|jstanford" | egrep -v "pyc"'

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
    print "\nchoose a settings file to use:"
    return _choose(candidates).split(' ')[0] if verbose \
        else _choose(candidates)


@task
def runserver(verbose=False):
    """Do runserver using a user-selected settings file.

    :keyword verbose: Display detail about each settings choice?
    :type verbose: bool

    """

    # Get the user's desired settings file, strip off the trailing ".py", and
    # convert it into a Python path.
    settings = _choose_runserver_settings(verbose).replace(".py", '')
    settings = SETTINGS_DIR + '.' + settings

    _django_manage("runserver", proj_settings=settings)


@task
def test(target=''):
    """Run the unit tests.

    :keyword target: The app or test target. E.g., goldstone.user
    :type target: str

    """

    _django_manage("test", target=target, proj_settings=DEV_SETTINGS)
