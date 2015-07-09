"""Fabric file for Goldstone installable applications."""
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
from contextlib import contextmanager

from fabric.api import task
from fabric.colors import green, cyan, red
from fabric.contrib.console import confirm
from fabric.utils import abort, fastprint
from fabric.operations import prompt
import os
import sys

from goldstone.installable_apps.models import Application

# The Goldstone install dir
INSTALL_DIR = '/opt/goldstone'

# The Goldstone settings path, relative to the Goldstone root where we're
# executing from.
PROD_SETTINGS = "goldstone.settings.production"


@contextmanager
def _django_env(proj_settings, install_dir):
    """Load a new context into DJANGO_SETTINGS_MODULE.

    We can't import installer_fabfile._django_env because installer_fabfile.py
    is cleverly renamed to fabfile.py during installation. Aliases are bad.

    """

    sys.path.append(install_dir)
    old_settings = os.environ.get('DJANGO_SETTINGS_MODULE')
    os.environ['DJANGO_SETTINGS_MODULE'] = proj_settings

    # Yield control.
    yield

    # Restore state.
    sys.path.remove(install_dir)
    if old_settings is None:
        del os.environ['DJANGO_SETTINGS_MODULE']
    else:
        os.environ['DJANGO_SETTINGS_MODULE'] = old_settings


class Variables(object):
    """Used for verify_apps local variables.

    Python 2 doesn't have the nonlocal statement.

    """

    pass


@task
def verify_apps(settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Verify each Application table row, and help the user fix bad rows.

    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    variables = Variables()

    # pylint: disable=W0201

    def handler(row):
        """Process an error for an installable application.

        :param row: An installable app that should exist, but doesn't.
        :type row: Application

        """

        # We display this message only once.
        EXPLANATION = "\n\nThe installable application table has at least " \
                      "one bad row.\n\n" \
                      "Each row contains an application's root URL segment, " \
                      "which Goldstone's client uses to communicate with " \
                      "the installed app. If it's bad, the app is " \
                      "unusable.\n\n" \
                      "This row's root URL segment is bad. Either the row " \
                      "is corrupted, or the application it's for was " \
                      "deleted from Goldstone.\n\n" \
                      "Solinea recommends that bad rows be deleted, so that " \
                      "the table accurately reflects what's installed in " \
                      "Goldstone.\n"

        # This is displayed for each row.
        ROW = "\nHere is a bad row in the installable application table:\n\n" \
              "\tname: {name}\n" \
              "\tversion: {version}\n" \
              "\tmanufacturer: {manufacturer}\n" \
              "\turl_root: {url_root}\n" \
              "\tinstalled_date: {installed_date}\n" \
              "\tupdated_date: {updated_date}\n " \
              "\tnotes: {notes}\n\n"

        # The prompt string.
        COMMAND = "Do you want to (I)gnore this row for now, (A)bort this " \
                  "command, or (D)elete this row?"

        # If this is the first bad row found, explain the facts of life.
        if not variables.errors_found:
            variables.errors_found = True
            fastprint(red(EXPLANATION))

        # Describe the bad row.
        fastprint(ROW.format(**row.__dict__))

        # Ask the user what to do about this bad row. Default is Ignore.
        response = prompt(COMMAND, default='I', validate=r'^[IiAaDd]$')
        response = response.upper()

        if response == 'I':
            fastprint("error ignored ...\n")
            variables.all_errors_fixed = False
        elif response == 'A':
            abort('')
        elif response == 'D':
            row.delete()
            fastprint("row deleted ...\n")
        else:
            # We should never get here.
            abort("oh a wise guy huh?")

    # These are for printing a summary when we're all done.
    variables.errors_found = False
    variables.all_errors_fixed = True

    # Switch to the right environment (because we're going to read from the
    # database), and verify the Application table.
    with _django_env(settings, install_dir):
        from goldstone.installable_apps import startup

        startup(error_handler=handler)

    # Print a nice summary.
    if variables.errors_found:
        if variables.all_errors_fixed:
            print(cyan("\nBad apps found and fixed!"))
        else:
            print(red("\nBad apps found and not fixed."))
    else:
        print(green("\nAll apps are good!"))


@task
def install_app(name, settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Install an installable application.

    :param name: The application's installation name
    :type name: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # Used to describe a new or updated row's data.
    ROW = "\tname: %s\n" \
          "\tversion: %s\n" \
          "\tmanufacturer: %s\n" \
          "\turl_root: %s\n" \
          "\tnotes: %s\n\n"

    def url_root_check(url_root):
        """Return True if the url_root is legal, raise exception otherwise."""
        import re

        # Regex that defines an illegal URL root.
        URL_ROOT = r'^http://|/.*|.*/|/.*/$'

        if re.match(URL_ROOT, url_root):
            raise ValueError("url_root must not start with http:// or a /, "
                             "and must not end with a slash.")

        if Application.objects.filter(url_root=url_root).exists():
            raise ValueError('url_root "%s" is already used.  Choose a '
                             'different URL root, or delete the app '
                             'that\'s currently using it.' %
                             url_root)

        return True

    # Switch to the right environment because we're going to access the
    # database.
    with _django_env(settings, install_dir):
        # First, get some information from the user.
        fastprint("\nGathering information about %s ...\n" % name)

        app_name = prompt(" application name?", default=name)
        if app_name != name:
            response = \
                confirm('"%s" differs from the name you used when you invoked '
                        'this command. Are you sure you want to use it as '
                        'the application\'s name?' %
                        app_name)
            if response:
                name = app_name
            else:
                sys.exit()

        version = prompt(" version?")
        manufacturer = prompt(" manufacturer?")
        url_root = prompt(" url_root?", validate=url_root_check)
        notes = prompt(" notes?")

        # Remember if this app already exists from this manufacturer.
        replacement = \
            Application.objects.filter(name=name,
                                       manufacturer=manufacturer).exists()
        row_to_update = \
            Application.objects.get(url_root=url_root) if replacement else None

        # Concoct the settings.base.INSTALLED_APPS line, and the urls.py
        # include line.
        installedapp = "'goldstone.%s'," % name
        urlpattern = \
            "url(r'^{0}/', include('goldstone.{0}.urls')),".format(name)

        # Tell the user what we're about to do.
        fastprint("\n\nWe're going to ")
        if replacement:
            fastprint(red("replace an existing row in the installable "
                          "applications table, named %s.\n"))
        else:
            fastprint("add a row to the installable applications table.\n")

        fastprint("The data written to the table row will be:\n")
        fastprint(ROW % (name, version, manufacturer, url_root, notes))

        if replacement:
            fastprint("We're not going to change INSTALLED_APPS or urls.py, "
                      "because the previous version must\'ve caused them to "
                      "be edited already.\n")
        else:
            fastprint("We're going to add this line to the end of "
                      "INSTALLED_APPS:\n\t%s\n" %
                      installedapp)
            fastprint("We're going to add this line to the end of "
                      "Goldstone\'s urlconf patterns:\n\t%s\n" %
                      urlpattern)

        # Get the user's OK to proceed.
