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
from __future__ import print_function

import os
import os.path
import sys

from contextlib import contextmanager
from fabric.api import task, local, warn, prompt
from fabric.colors import green, cyan
from fabric.utils import fastprint
from fabric.operations import prompt

# Add the current directory to the module search path.
sys.path.append('')

# The Goldstone settings directory, relative to the Goldstone root where we're
# executing from.
SETTINGS_DIR = "goldstone.settings"

# The default settings are to run Elasticsearch and PostgreSQL locally.
DEV_SETTINGS = SETTINGS_DIR + ".test_oak_c2"

# Values for the default tenant and default_tenant_admin that are created when
# Goldstone is installed. These are defined at the module level so that our
# unit tests can get at them.
DEFAULT_TENANT = "default"
DEFAULT_TENANT_OWNER = "None"
DEFAULT_ADMIN = "gsadmin"
DEFAULT_ADMIN_PASSWORD = "changeme"

ES_REPO_FILENAME = "/etc/yum.repos.d/elasticsearch-1.4.repo"

ES_REPO_TEXT = "[elasticsearch-1.4]\n" + \
    "name=Elasticsearch repository for 1.4.x packages\n" + \
    "baseurl=http://packages.elasticsearch.org/" + \
    "elasticsearch/1.4/centos\n" + \
    "gpgcheck=1\n" + \
    "gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch\n" + \
    "enabled=1\n"

LOGSTASH_REPO_FILENAME = "/etc/yum.repos.d/logstash-1.4.repo"

LOGSTASH_REPO_TEXT = "[logstash-1.4]\n" + \
    "name=Logstash repository for 1.4.x packages\n" + \
    "baseurl=http://packages.elasticsearch.org/" + \
    "logstash/1.4/centos\n" + \
    "gpgcheck=1\n" + \
    "gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch\n" + \
    "enabled=1\n"

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


@task
def load(proj_settings=DEV_SETTINGS):
    """Initialize the system's Elasticsearch templates.

    This is the last installation step before executing a runserver command.

    """

    print(green("initializing goldstone's elasticsearch templates ..."))
    with _django_env(proj_settings):
        from goldstone.initial_load import initialize_elasticsearch

        initialize_elasticsearch()


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
    CANDIDATES = 'egrep "production|dev_|test_" | egrep -v "pyc|~"'

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
def syncmigrate(settings=None, verbose=False):
    """Do a /manage.py syncdb and migrate.

    This is the last installation step before executing a load command.

    :keyword settings: A settings file to use. If not specified, we will ask
                       user to select one
    :type settings: str
    :keyword verbose: Display detail about each settings choice?
    :type verbose: bool

    """

    print("doing a syncdb and migrate ...")

    if not settings:
        settings = _django_settings_module(verbose)

    print()

    _django_manage("syncdb --noinput --migrate", proj_settings=settings)

    # We must create the superuser separately because of an interaction between
    # DRF and Django signals. See
    # https://github.com/tomchristie/django-rest-framework/issues/987.
    print()
    print(green('Please create a Django superuser, username "admin" ...'))
    _django_manage("createsuperuser --username=admin", proj_settings=settings)


def _tenant_init(tenant=None, tenant_owner=None, admin=None, password=None,
                 settings=None):
    """Create a tenant and default_tenant_admin, or use existing ones.

    See the tenant_init() docstring for a description of the parameters.

    This is a separate function in order to facilitate unit testing.

    :return: The tenant created, and the path to the settings file used when
             we created the tenant and default_tenant_admin.
    :rtype: (Tenant, str)

    """

    print("initializing the Goldstone tenant and OpenStack cloud entry ...")

    # Load the defaults, if the user didn't override them.
    if not tenant:
        tenant = DEFAULT_TENANT
    if not tenant_owner:
        tenant_owner = DEFAULT_TENANT_OWNER
    if not admin:
        admin = DEFAULT_ADMIN
    if not password:
        password = DEFAULT_ADMIN_PASSWORD

    # Get the settings under which we should execute.
    if not settings:
        settings = _django_settings_module(False)

    with _django_env(settings):
        # It's important to do these imports here, after DJANGO_SETTINGS_MODULE
        # has been changed!
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ObjectDoesNotExist
        from goldstone.tenants.models import Tenant

        # Process the tenant.
        try:
            tenant = Tenant.objects.get(name=tenant)
        except ObjectDoesNotExist:
            # The tenant does not already exist. Create it.
            tenant = Tenant.objects.create(name=tenant, owner=tenant_owner)
        else:
            # The tenant already exists. Print a message.
            fastprint("Tenant %s already exists. We will not modify it.\n" %
                      tenant)

        # Process the tenant admin.
        try:
            user = get_user_model().objects.get(username=admin)
        except ObjectDoesNotExist:
            fastprint("Creating tenant admin account %s with the password, "
                      "'%s' ..." %
                      (admin, password))
            user = get_user_model().objects.create_user(username=admin,
                                                        password=password)
            fastprint("done.\n")
        else:
            # The tenant_admin already exists. Print a message.
            fastprint("Admin account %s already exists. We will use it.\n" %
                      admin)

        # Link the tenant_admin account to this tenant.
        user.tenant = tenant
        user.tenant_admin = True
        user.default_tenant_admin = True
        user.save()

    return (tenant, settings)


@task
def tenant_init(tenant=None, tenant_owner=None, admin=None, password=None,
                settings=None):
    """Create a tenant and default_tenant_admin, or use existing ones; and
    create a cloud under the tenant.

    If the tenant doesn't exist, we create it.  If the admin doesn't exist, we
    create it as the default_tenant_admin, and the tenant's tenant_admin.

    If the tenant already exists, we print an informational message and leave
    it alone.

    If the admin already exists, we print an informational message. If he/she
    is not a tenant admin of the new tenant, we make him/her it. He/she gets
    made the (a) default_tenant_admin.

    :keyword tenant: The name of the tenant to be created. If not specified, a
                     default is used
    :type tenant: str
    :keyword tenant_owner: The tenant owner. If unspecified, a default is used
    :type tenant_owner: str
    :keyword admin: The name of the tenant_admin to be created.  If
                    unspecified, a default is used
    :type admin: str
    :keyword password: The admin account's password, *if* we create it
    :type password: str
    :keyword settings: If present, the path of the Django settings file to use.
                       Otherwise, we will ask the user to select one.
    :type settings: str

    """

    # pylint: disable=R0914

    # Values for the default OpenStack cloud that we will create under the
    # default tenant. These come from environment variables, if present;
    # otherwise a sensible default.
    DEFAULT_CLOUD_TENANT = os.environ.get('DEFAULT_CLOUD_TENANT', "admin")
    DEFAULT_CLOUD_USERNAME = os.environ.get("DEFAULT_CLOUD_USERNAME", "admin")
    DEFAULT_CLOUD_PASSWORD = os.environ.get("DEFAULT_CLOUD_PASSWORD",
                                            "changeme")
    DEFAULT_CLOUD_AUTH_URL = os.environ.get("DEFAULT_CLOUD_AUTH_URL",
                                            "http://127.0.0.1:5000/")

    # The OpenStack identity authorization URL has a version number segment.
    # This is the authorization version we use. It should end with a slash, but
    # maybe that's not necessary.
    CLOUD_AUTH_URL_VERSION = "v3/"

    # Create the tenant and tenant_admin.
    tenant, settings = _tenant_init(tenant,
                                    tenant_owner,
                                    admin,
                                    password,
                                    settings)

    # Now create a single OpenStack cloud under the tenant. Give the user
    # an opportunity to override the defaults.
    with _django_env(settings):
        from goldstone.tenants.models import Cloud

        fastprint("\nAn OpenStack cloud entry will now be created under the "
                  "default tenant.\n")
        cloud_tenant_name = prompt("OS_TENANT_NAME?",
                                   default=DEFAULT_CLOUD_TENANT)
        cloud_username = prompt("OS_USERNAME?", default=DEFAULT_CLOUD_USERNAME)
        cloud_password = prompt("OS_PASSWORD?", default=DEFAULT_CLOUD_PASSWORD)
        cloud_auth_url = prompt("OS_AUTH_URL_BASE?",
                                default=DEFAULT_CLOUD_AUTH_URL)

        cloud_auth_url = os.path.join(cloud_auth_url, CLOUD_AUTH_URL_VERSION)

        Cloud.objects.create(tenant=tenant,
                             tenant_name=cloud_tenant_name,
                             username=cloud_username,
                             password=cloud_password,
                             auth_url=cloud_auth_url)


def _collect_static(proj_settings=None):
    """collect static files if STATIC_ROOT is set in the settings file"""

    with _django_env(proj_settings):
        from django.conf import settings

        if settings.STATIC_ROOT is not None:
            print(green("Collecting the static files under the web server."))
            print(cyan("Enter 'yes' if prompted to confirm."))
            print()
            _django_manage("collectstatic --noinput",
                           proj_settings=proj_settings)


def _reconcile_hosts(proj_settings=None):
    """Builds the initial entries in the Hosts table from agg of loggers."""
    with _django_env(proj_settings):
        print(green("Collecting information about Openstack resources."))
        from goldstone.apps.nova.tasks import reconcile_hosts
        reconcile_hosts()


@task
def goldstone_init(verbose=False):
    """Do a syncmigrate, tenant_init, and load.

    :keyword verbose: Display detail about each settings choice?
    :type verbose: bool

    """

    print("Goldstone database and Elasticsearch initialization ...")
    settings = _django_settings_module(verbose)

    syncmigrate(settings=settings)
    tenant_init(settings=settings)
    _collect_static(proj_settings=settings)
    _reconcile_hosts(proj_settings=settings)
    load()


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

    def process_files(arg, dirname, names):
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
