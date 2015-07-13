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
          "\tnotes: %s\n"

    def url_root_check(url_root):
        """Return url_root if it is legal, otherwise raise an exception."""
        import re
        # This is a closure, so this import is in the caller's environment,
        # which specified the settings and installation directory.
        from goldstone.installable_apps.models import Application

        # Regex that defines an illegal URL root.
        URL_ROOT = r'^http://|https://|/.*|.*/|/.*/$'

        if re.match(URL_ROOT, url_root):
            raise ValueError("url_root must not start with http:// or a /, "
                             "and must not end with a slash.")

        if Application.objects.filter(url_root=url_root).exists():
            raise ValueError('url_root "%s" is already used.  Choose a '
                             'different URL root, or delete the app '
                             'that\'s currently using it.' %
                             url_root)

        return url_root

    # Switch to the right environment because we're going to access the
    # database.
    with _django_env(settings, install_dir):
        from goldstone.installable_apps.models import Application

        # First, get some information from the user.
        fastprint("\nGathering information about %s ...\n" % name)

        version = prompt(" version?")
        manufacturer = prompt(" manufacturer?")
        url_root = prompt(" url_root?", validate=url_root_check)
        notes = prompt(" notes?")

        # Remember if this app already exists from this manufacturer.
        replacement = Application.objects.filter(name=name).exists()

        # Concoct the settings.base.INSTALLED_APPS line, and the urls.py
        # include line.
        installedapp = INSTALLED_APP % name
        urlpatterns = URLS_PY.format(name, url_root)

        # Create the different messages we display for an update vs. an insert.
        row_action = red("replace an existing row in") if replacement \
            else "add a row to"

        if replacement:
            base_urls = "We won't change INSTALLED_APPS or urls.py, so the " \
                        "previous version's entries will be reused.\n"
        else:
            base_urls = "We'll add this line to Goldstone\'s " \
                        "INSTALLED_APPS:\n\t%s" % \
                        installedapp
            base_urls += "We'll add this to the end of Goldstone\'s " \
                         "URLconf:%s\n" % \
                         urlpatterns

        # Tell the user what we're about to do.
        fastprint(
            "\nPlease confirm the following.\nWe'll " +
            row_action +
            " the installable applications table. It will contain:\n" +
            ROW % (name, version, manufacturer, url_root, notes) +
            base_urls)

        # Get permission to proceed.
        if confirm('Proceed?'):
            if replacement:
                row = Application.objects.get(name=name)
                row.version = version
                row.manufacturer = manufacturer
                row.url_root = url_root
                row.notes = notes
                row.save()
            else:
                # Installing a new app. We'll track where we are, in case an
                # exception occurs.
                try:
                    # First, add the new row.
                    step = 0
                    Application.objects.create(name=name,
                                               version=version,
                                               manufacturer=manufacturer,
                                               url_root=url_root,
                                               notes=notes)

                    # Now add the app to INSTALLED_APPS. SED is scary, so we'll
                    # use Python instead.
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
                        installedapp + \
                        filedata[insert:]

                    # Update the file.
                    step = 2

                    with open(filepath, 'w') as f:
                        f.write(filedata)

                    # Now add the app to the end of the URLconf.
                    step = 3

                    filepath = os.path.join(install_dir, "goldstone/urls.py")

                    with open(filepath, 'a') as f:
                        f.write(urlpatterns)

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
                                  "were updated. You must manually edit " \
                                  "urls.py."
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
            fastprint("The app \"%s\" isn't found in the table.\n" % name)
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
                nextline = filedata.index('\n', insert) + 1

                # Delete the line.
                filedata = filedata[:insert] + filedata[nextline:]

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
                              "were updated. You must manually edit urls.py."
                else:
                    # We should never get here.
                    raise

                abort(red(message % exc))
