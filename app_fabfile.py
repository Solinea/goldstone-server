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

# The Goldstone install dir
INSTALL_DIR = '/opt/goldstone'

# The Goldstone settings path, relative to the Goldstone root where we're
# executing from.
PROD_SETTINGS = "goldstone.settings.production"


# The start of the settings.base.INSTALLED_APPS definition.
INSTALLED_APPS_START = "INSTALLED_APPS = ("

# The line we add to INSTALLED_APPS.
INSTALLED_APP = "    '%s',     # Don't edit this line!\n"

# The line we add to the end of urls.py.
URLS_PY = "\n# Include the {0} application.  Don't edit this entry!\n" \
          "import {0}\n" \
          "urlpatterns += patterns('', url(r'^{1}/', include('{0}.urls')))\n"

# Used for searching and inserting into CELERYBEAT_SCHEDULE. Don't terminate
# these strings with \n.
CELERYBEAT_SCHEDULE = "CELERYBEAT_SCHEDULE = {"
CELERYBEAT_APPS = \
    "# User-installed application tasks are inserted after this line."
CELERYBEAT_APP_INCLUDE = \
    "# Tasks for {0}.\n" \
    "from {0}.settings import CELERYBEAT_SCHEDULE as {0}_celerybeat\n" \
    "CELERYBEAT_SCHEDULE.update({0}_celerybeat)\n\n"


@contextmanager
def _django_env(proj_settings, install_dir):
    """Load a new context into DJANGO_SETTINGS_MODULE.

    We can't use installer_fabfile._django_env, because installer_fabfile.py
    is renamed to fabfile.py during installation.

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

    We need this because Python 2 doesn't have the nonlocal statement.

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
        EXPLANATION = "\n\nThe installable-application table has at least " \
                      "one bad row.\n\n" \
                      "Each row contains an application's root URL segment, " \
                      "which Goldstone's client uses to communicate with " \
                      "the app. If it's bad, the app is unusable.\n\n" \
                      "This row's root URL segment is bad. Either the row " \
                      "is corrupted, or the application was deleted from " \
                      "Goldstone.\n\n" \
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
        from goldstone.installable_apps.models import Application

        Application.objects.check_table(error_handler=handler)

    # Print a nice summary.
    if variables.errors_found:
        if variables.all_errors_fixed:
            print(cyan("\nBad apps found and fixed!"))
        else:
            print(red("\nBad apps found and not fixed."))
    else:
        print(green("\nAll apps are good!"))


def _install_app_info(name):
    """Gather the package installation information, and display our intentions
    to the user.

    The package has already been installed into Python's execution environment.

    This is called from install_app, so its execution environment will be in
    effect.

    :param name: The name of the application being installed
    :type name: str
    :return: The application's database table values, and some values related
             to the installation environment
    :rtype: (dict, dict)

    """
    from importlib import import_module
    import re
    from goldstone.installable_apps.models import Application

    # Regex that defines an illegal URL root.
    URL_ROOT = r'^http://|https://|/.*|.*/|/.*/$'

    # For importing or inputting environmental values from the application.
    APP_SYMBOLS = ["version", "manufacturer", "url_root", "notes"]

    # Used to describe a new or updated Application row.
    ROW = "\tname: {name}\n" \
          "\tversion: {version}\n" \
          "\tmanufacturer: {manufacturer}\n" \
          "\turl_root: {url_root}\n" \
          "\tnotes: {notes}\n"

    fastprint("\nCollecting information about %s ..." % name)

    try:
        the_app = import_module(name)
    except ImportError:
        abort("Can't import the module. Have you installed it?")

    app_db = {"name": name}
    app_install = {}

    # Read the required application symbols.
    for app_symbol in APP_SYMBOLS:
        dunder = "__" + app_symbol + "__"
        app_db[app_symbol] = the_app.__dict__.get(dunder)

        if app_db[app_symbol] is None:
            abort("The application didn't define the %s variable!" %
                  dunder)

    # Verify that url_root is in the correct format, and it's not being
    # used (or if it is, it's being used by this app already).
    if re.match(URL_ROOT, app_db["url_root"]):
        raise ValueError("url_root must not start with http:// or a /, "
                         "and must not end with a slash.")

    if Application.objects.filter(url_root=app_db["url_root"])\
            .exclude(name=name).exists():
        raise ValueError('url_root "%s" is already used.  Choose a '
                         'different URL root, or delete the app '
                         'that\'s currently using it.' %
                         app_db["url_root"])

    # Remember if this app already exists.
    app_install["replacement"] = Application.objects.filter(name=name).exists()

    # Concoct the settings.base.INSTALLED_APPS line, and the urls.py
    # include line.
    app_install["installedapp"] = INSTALLED_APP % name
    app_install["urlpatterns"] = URLS_PY.format(name, app_db["url_root"])

    # Create the different messages we display for an update vs. an insert.
    if app_install["replacement"]:
        row_action = red("We'll replace an existing row in")
        base_urls = red("\nWe won't change settings/base.py or urls.py, so "
                        "the previous version's entries will be reused.\n")
    else:
        row_action = red("We'll add a row to")
        base_urls = \
            red("\nWe'll add this to Goldstone\'s INSTALLED_APPS:\n") + \
            "\t{0}\n".format(app_install["installedapp"]) + \
            red("We'll add this to Goldstone\'s URLconf:") + \
            "{0}\n".format(app_install["urlpatterns"])

    celery_tasks = \
        red("We'll add these lines to CELERYBEAT_SCHEDULE:\n") + \
        CELERYBEAT_APP_INCLUDE.format(name)

    # Tell the user what we're about to do.
    fastprint("\nPlease confirm this:\n\n" +
              row_action +
              red(" the installable-applications table. It will contain:\n") +
              ROW.format(**app_db) +
              base_urls +
              celery_tasks)

    return (app_db, app_install)


@task
def install_app(name, settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Install an installable application.

    The name is supplied on the command line.

    The version, manufacturer, url_root, notes, and celery tasks are supplied
    from the application.

    :param name: The application's installation name
    :type name: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # Switch to the right environment, because we'll access the database.
    with _django_env(settings, install_dir):
        from goldstone.installable_apps.models import Application

        # Gather the package installation information from the package or the
        # user. Remember, the package has already been installed into Python's
        # execution environment.
        app_db, app_install = _install_app_info(name)

        # Get permission to proceed.
        if confirm('Proceed?'):
            if app_install["replacement"]:
                row = Application.objects.get(name=name)
                row.version = app_db["version"]
                row.manufacturer = app_db["manufacturer"]
                row.url_root = app_db["url_root"]
                row.notes = app_db["notes"]
                row.save()
            else:
                # Installing a new app. We'll track where we are, in case an
                # exception occurs.
                try:
                    # First, add the new row.
                    step = 0
                    Application.objects.create(**app_db)

                    # Now add the app to INSTALLED_APPS and
                    # CELERYBEAT_SCHEDULE. SED is scary, so we'll use Python
                    # instead.
                    step = 1

                    filepath = os.path.join(install_dir,
                                            "goldstone/settings/base.py")

                    with open(filepath) as f:
                        filedata = f.read()

                    # Find the end of the INSTALLED_APPS tuple and insert the
                    # line there.
                    insert = filedata.index(INSTALLED_APPS_START)
                    insert = filedata.index(')', insert)

                    filedata = \
                        filedata[:insert] + \
                        app_install["installedapp"] + \
                        filedata[insert:]

                    # Now find CELERYBEAT_SCHEDULE, and the start of the
                    # user-installed apps section. We do both to maximize the
                    # probability of doing this correctly.
                    insert = filedata.index(CELERYBEAT_SCHEDULE)
                    insert = filedata.index(CELERYBEAT_APPS, insert)

                    # Insert at the start of the next line.
                    insert = filedata.index('\n', insert) + 1
                    filedata = \
                        filedata[:insert] + \
                        CELERYBEAT_APP_INCLUDE.format(name) + \
                        filedata[insert:]

                    # Update the file.
                    step = 2

                    with open(filepath, 'w') as f:
                        f.write(filedata)

                    # Now add the app to the end of the URLconf.
                    step = 3

                    filepath = os.path.join(install_dir, "goldstone/urls.py")

                    with open(filepath, 'a') as f:
                        f.write(app_install["urlpatterns"])

                except Exception as exc:       # pylint: disable=W0703
                    # Ooops! Tell the user what happened, because they're going
                    # to have to unwind things manually.
                    if step == 0:
                        message = "%s while updating the Application table. " \
                                  "It's probably OK, but check it."
                    elif step == 1:
                        message = "%s while reading base.py. The " \
                                  "Application table was modified. You must " \
                                  "edit settings/base.py and urls.py."
                    elif step == 2:
                        message = "%s while writing base.py. The " \
                                  "Application table was modified. You must " \
                                  "edit settings/base.py and urls.py."
                    elif step == 3:
                        message = "%s while writing urls.py. The " \
                                  "Application table and settings/base.py " \
                                  "were updated. You must edit urls.py."
                    else:
                        # We should never get here.
                        raise

                    abort(red(message % exc))


@task
def remove_app(name, settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Remove an installable application.

    :param name: The application's installation name
    :type name: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """
    from django.core.exceptions import ObjectDoesNotExist

    # Switch to the right environment because we're going to access the
    # database.
    with _django_env(settings, install_dir):
        from goldstone.installable_apps.models import Application

        # Get the app row.
        try:
            row = Application.objects.get(name=name)
        except ObjectDoesNotExist:
            fastprint("The app \"%s\" isn't in the table.\n" % name)
            sys.exit()

        if confirm('We will remove the %s application. Proceed?' % name):
            # We'll track where we are, in case an exception occurs.
            try:
                # First, delete the row.
                step = 0
                row.delete()

                # Now remove the app from INSTALLED_APPS. SED is scary, so
                # we'll use Python instead.
                step = 1

                filepath = os.path.join(install_dir,
                                        "goldstone/settings/base.py")

                with open(filepath) as f:
                    filedata = f.read()

                # Find the INSTALLED_APPS tuple. Then find the start of the
                # line for this app, and the line after it.
                insert = filedata.index(INSTALLED_APPS_START)
                insert = filedata.index(INSTALLED_APP % name, insert)
                end = filedata.index('\n', insert) + 1

                # Delete the line.
                filedata = filedata[:insert] + filedata[end:]

                # Now find CELERYBEAT_SCHEDULE, and the start of the
                # user-installed apps section. We do both to maximize the
                # probability of doing this correctly. Then, find the beginning
                # of the line that starts this app's task entries, and the
                # beginning of the line after the end of this app's task
                # entries.
                insert = filedata.index(CELERYBEAT_SCHEDULE)
                insert = filedata.index(CELERYBEAT_APPS, insert)

                insert = filedata.index(CELERYBEAT_APP_INCLUDE.format(name),
                                        insert)
                end = insert
                for _ in range(CELERYBEAT_APP_INCLUDE.count('\n')):
                    end = filedata.index('\n', end) + 1

                filedata = filedata[:insert] + filedata[end:]

                # Update the file.
                step = 2

                with open(filepath, 'w') as f:
                    f.write(filedata)

                # Now delete the app from the URLconf.
                step = 3

                filepath = os.path.join(install_dir, "goldstone/urls.py")

                with open(filepath, 'r') as f:
                    filedata = f.read()

                insert = filedata.index(URLS_PY.format(name, row.url_root))

                with open(filepath, 'w') as f:
                    f.write(filedata[:insert])

            except Exception as exc:       # pylint: disable=W0703
                # Ooops! Tell the user what happened, because they're going
                # to have to unwind things manually.
                if step == 0:
                    message = "%s while updating the Application table. " \
                              "It's probably OK, but check it."
                elif step == 1:
                    message = "%s while reading base.py. The " \
                              "Application table was modified. You must " \
                              "manually edit settings/base.py and urls.py."
                elif step == 2:
                    message = "%s while writing base.py. The " \
                              "Application table was modified. You must " \
                              "manually edit settings/base.py and urls.py."
                elif step == 3:
                    message = "%s while writing urls.py. The " \
                              "Application table and settings/base.py " \
                              "were updated. You must edit urls.py."
                else:
                    # We should never get here.
                    raise

                abort(red(message % exc))
