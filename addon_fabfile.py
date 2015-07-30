"""Fabric file for Goldstone add-ons (installable Django applications)."""
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
from shutil import copytree, rmtree

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
URLS_PY = "\n# Include the {0} add-on.  Don't edit this entry!\n" \
          "import {0}\n" \
          "urlpatterns += patterns('', url(r'^{1}/', include('{0}.urls')))\n"

# The path, under the add-on's Python installation directory, where we find its
# JavaScript files.
STATIC_SOURCE = "static"

# The path, under INSTALL_DIR, in which we create a *directory* for the
# add-on's JavaScript files. So, the JavaScript files will be found in
# INSTALL_DIR/STATIC_ADDONS_HOME/<addon name>/*.js.
STATIC_ADDONS_HOME = "goldstone/static/addons"

# An add-on's script tag is inserted into base.html, after these lines.
STATIC_START = \
    '<!-- append addon script tags via "fab install_addon" command here ' \
    '-->\n' \
    '<!-- example script tag: -->\n' \
    '<!-- <script src="{% static \'addons/yourapp/main.js\' %}"></script> ' \
    '-->\n'

# The add-on's script tag template.
STATIC_TAG = '<script src="{%% static \'addons/%s/main.js\' %%}"></script>\n'

# Used for searching and inserting into CELERYBEAT_SCHEDULE. Don't terminate
# these strings with \n.
CELERYBEAT_SCHEDULE = "CELERYBEAT_SCHEDULE = {"
CELERYBEAT_APPS = \
    "# User-installed add-on tasks are inserted after this line."
CELERYBEAT_APP_INCLUDE = \
    "# Tasks for {0}.\n" \
    "from {0}.settings import CELERYBEAT_SCHEDULE as {0}_celerybeat\n" \
    "CELERYBEAT_SCHEDULE.update({0}_celerybeat)\n"


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
    """Used for verify_addons local variables.

    We need this because Python 2 doesn't have the nonlocal statement.

    """

    pass


@task
def verify_addons(settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Verify each Addon table row, and help the user fix bad rows.

    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    variables = Variables()

    # pylint: disable=W0201

    def handler(row):
        """Process an error for an user add-on.

        :param row: An add-on that should exist, but doesn't.
        :type row: Addon

        """

        # We display this message only once.
        EXPLANATION = "\n\nThe Addon table has at least one bad row.\n\n" \
                      "Each row contains an add-on's root URL segment, " \
                      "which Goldstone's client uses to communicate with " \
                      "the add-on. If it's bad, the add-on is unusable.\n\n" \
                      "This row's root URL segment is bad. Either the row " \
                      "is corrupted, or the add-on was deleted from " \
                      "Goldstone.\n\n" \
                      "Solinea recommends that bad rows be deleted, so that " \
                      "the table accurately reflects what's installed in " \
                      "Goldstone.\n"

        # This is displayed for each row.
        ROW = "\nHere is a bad row in the add-on table:\n\n" \
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
    # database), and verify the Addon table.
    with _django_env(settings, install_dir):
        from goldstone.addons.models import Addon

        count, _ = Addon.objects.check_table(error_handler=handler)

    # Display a summary.
    if variables.errors_found:
        if variables.all_errors_fixed:
            print(cyan("\nBad add-ons found and fixed!"))
        else:
            print(red("\nBad add-ons found and not fixed."))

    print(green("\n%s add-ons in the table." % count))


def _install_addon_info(name, install_dir):           # pylint: disable=R0914
    """Gather the package installation information, and display our intentions
    to the user.

    The package has already been installed into Python's execution environment.

    Install_addon calls this, so its execution environment is in effect.

    :param name: The name of the application (add-on) being installed
    :type name: str
    :param install_dir: The path to the Goldstone installation directory.
    :type install_dir: str
    :return: The add-on's database table values, and some values related
             to the installation environment
    :rtype: (dict, dict)

    """
    from importlib import import_module
    import re
    from goldstone.addons.models import Addon

    # Regex that defines an illegal URL root.
    URL_ROOT = r'^http://|https://|/.*|.*/|/.*/$'

    # For importing or inputting environmental values from the add-on.
    APP_SYMBOLS = ["version", "manufacturer", "url_root", "notes"]

    # Used to describe a new or updated Addon row.
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

    # Initialize the return values.
    addon_db = {"name": name}
    addon_install = {"static_source":
                     os.path.join(the_app.__path__[0], STATIC_SOURCE),
                     "static_dest":
                     os.path.join(install_dir, STATIC_ADDONS_HOME, name)}

    # Read the required add-on symbols.
    for app_symbol in APP_SYMBOLS:
        dunder = "__" + app_symbol + "__"
        addon_db[app_symbol] = the_app.__dict__.get(dunder)

        if addon_db[app_symbol] is None:
            abort("The add-on didn't define the %s variable!" % dunder)

    # Verify that url_root is in the correct format, and it's not being
    # used (or if it is, it's being used by this add-on already).
    if re.match(URL_ROOT, addon_db["url_root"]):
        raise ValueError("url_root must not start with http:// or a /, "
                         "and must not end with a slash.")

    if Addon.objects.filter(url_root=addon_db["url_root"])\
            .exclude(name=name).exists():
        raise ValueError('url_root "%s" is already used.  Choose a '
                         'different URL root, or delete the app '
                         'that\'s currently using it.' %
                         addon_db["url_root"])

    # Remember if this add-on already exists.
    addon_install["replacement"] = Addon.objects.filter(name=name).exists()

    # Concoct the settings.base.INSTALLED_APPS line, and the urls.py
    # include line.
    addon_install["installedapp"] = INSTALLED_APP % name
    addon_install["urlpatterns"] = URLS_PY.format(name, addon_db["url_root"])

    # Create the different messages we display for an update vs. an insert.
    if addon_install["replacement"]:
        row_action = red("We'll replace an existing row in")
        base_urls = red("\nWe won't change anything else.\n\n")
        celery_tasks = ''
        javascript_changes = ''
    else:
        row_action = red("We'll add a row to")
        base_urls = \
            red("\nWe'll add this to Goldstone\'s INSTALLED_APPS:\n") + \
            "\t{0}\n".format(addon_install["installedapp"]) + \
            red("We'll add this to Goldstone\'s URLconf:") + \
            "{0}\n".format(addon_install["urlpatterns"])

        celery_tasks = \
            red("We'll add these lines to CELERYBEAT_SCHEDULE:\n") + \
            CELERYBEAT_APP_INCLUDE.format(name)

        javascript_changes = \
            "\nWe'll copy {0}/*.* to {1}/*.*, and add this line to " \
            "base.html:\n".format(addon_install["static_source"],
                                  addon_install["static_dest"])
        javascript_changes = \
            red(javascript_changes) + STATIC_TAG % name + '\n'

    # Tell the user what we're about to do.
    fastprint("\nPlease confirm this:\n\n" +
              row_action +
              red(" the addon table. It will contain:\n") +
              ROW.format(**addon_db) +
              base_urls +
              celery_tasks +
              javascript_changes)

    return (addon_db, addon_install)


def _install_addon_javascript(name, addon_install, install_dir):
    """Install an add-on's JavaScript files, and insert a script tag into
    base.html.

    :param name: The add-on name
    :type name: str
    :param addon_install: An "addon_install" dict for an add-on. :-)
    :type addon_install: dict
    :param install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # Delete the destination directory if it already exisets, and then copy the
    # add-on's JavaScript files to it.
    rmtree(addon_install["static_dest"], ignore_errors=True)
    copytree(addon_install["static_source"], addon_install["static_dest"])

    # Create the script tag line, and read base.html.
    tag = STATIC_TAG % name
    filepath = os.path.join(install_dir, "goldstone/templates/base.html")

    with open(filepath) as f:
        filedata = f.read()

    # Go to the start of the line after the the add-on-script-tag-section's
    # herald. Because the herald is multiple lines, we must advance N newlines
    # to get past it.
    insert = filedata.index(STATIC_START)
    for _ in range(STATIC_START.count('\n')):
        insert = filedata.index('\n', insert) + 1

    # Insert the script tag line right after the herald.
    filedata = filedata[:insert] + tag + filedata[insert:]

    # Update the file.
    with open(filepath, 'w') as f:
        f.write(filedata)


def _remove_addon_javascript(name, install_dir):
    """Remove an add-on's JavaScript files, and its base.html script tag.

    :param name: The add-on name
    :type name: str
    :param install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # Delete the add-on's JavaScript files, if they exist. We re-create the
    # "static_dest" path.
    static_dest = os.path.join(install_dir, STATIC_ADDONS_HOME, name)
    rmtree(static_dest, ignore_errors=True)

    # Create the script tag line, and read base.html.
    tag = STATIC_TAG % name
    filepath = os.path.join(install_dir, "goldstone/templates/base.html")

    with open(filepath) as f:
        filedata = f.read()

    # Find the add-on script tag section, then find the add-on's static tag
    # line, then find the line after it. Then remove the script tag line.
    insert = filedata.index(STATIC_START)
    insert = filedata.index(tag, insert)
    end = filedata.index('\n', insert) + 1

    filedata = filedata[:insert] + filedata[end:]

    # Update the file.
    with open(filepath, 'w') as f:
        f.write(filedata)


@task
def install_addon(name, settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Install a user add-on.

    The name is supplied on the command line. The version, manufacturer,
    url_root, notes, and celery tasks are supplied from the add-on.

    :param name: The add-on's installation name
    :type name: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # Switch to the right environment, because we'll access the database.
    with _django_env(settings, install_dir):
        from goldstone.addons.models import Addon
        from rest_framework.authtoken.models import Token

        # Gather the package installation information from the package or the
        # user. Remember, the package has already been installed into Python's
        # execution environment.
        addon_db, addon_install = _install_addon_info(name, install_dir)

        # Get permission to proceed.
        if confirm('Proceed?', default=False):
            if addon_install["replacement"]:
                row = Addon.objects.get(name=name)
                row.version = addon_db["version"]
                row.manufacturer = addon_db["manufacturer"]
                row.url_root = addon_db["url_root"]
                row.notes = addon_db["notes"]
                row.save()
            else:
                # Installing a new add-on. We'll track where we are, in case an
                # exception occurs.
                try:
                    # First, add the new row.
                    error = "%s while updating the Addon table. It's " \
                            "probably OK, but check it."

                    Addon.objects.create(**addon_db)

                    # Now add the add-on to INSTALLED_APPS and
                    # CELERYBEAT_SCHEDULE. SED is scary, so we'll use Python
                    # instead.
                    error = "%s while reading base.py. The Addon table was " \
                            "modified. You must edit settings/base.py and " \
                            "urls.py, and copy the static files."

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
                        addon_install["installedapp"] + \
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
                    error = "%s while writing base.py. The Addon table was " \
                            "modified. You must edit settings/base.py and " \
                            "urls.py, and copy the static files."

                    with open(filepath, 'w') as f:
                        f.write(filedata)

                    # Now add the add-on to the end of the URLconf.
                    error = "%s while writing urls.py. The Addon table and " \
                            "settings/base.py were updated. You must edit " \
                            "urls.py, and copy the static files."

                    filepath = os.path.join(install_dir, "goldstone/urls.py")

                    with open(filepath, 'a') as f:
                        f.write(addon_install["urlpatterns"])

                    # Now move the client's JavaScript files, and insert the
                    # script tag.
                    error = "%s while copying the static files. You best " \
                            "check them, and base.html's script tag."

                    _install_addon_javascript(name, addon_install, install_dir)

                    # Finally, expire all user tokens to force users to
                    # re-login, which will reset their client-side localStorage
                    # 'addons' object.
                    error = "%s while trying to invalidate user tokens. You " \
                            "must clear the Token table."

                    Token.objects.all().delete()

                except Exception as exc:       # pylint: disable=W0703
                    # Oops!  Tell the user what happened, because they'll have
                    # to unwind things manually.
                    abort(red(error % exc))


@task
def remove_addon(name, settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Remove a user add-on.

    :param name: The add-on's installation name
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
        from goldstone.addons.models import Addon
        from rest_framework.authtoken.models import Token

        # Get the add-on's row.
        try:
            row = Addon.objects.get(name=name)
        except ObjectDoesNotExist:
            fastprint("The add-on \"%s\" isn't in the table.\n" % name)
            sys.exit()

        if confirm('We will remove the %s add-on. Proceed?' % name,
                   default=False):
            # We'll track where we are, in case an exception occurs.
            try:
                # First, delete the row.
                error = "%s while updating the Addon table. Check it."

                row.delete()

                # Now remove the add-on from INSTALLED_APPS. SED is scary, so
                # we'll use Python instead.
                error = "%s while reading base.py. The Addon table was " \
                        "modified. You must manually edit settings/base.py " \
                        "and urls.py, and remove the base.html script tag, " \
                        "and delete the add-on's JavaScript directory."

                filepath = os.path.join(install_dir,
                                        "goldstone/settings/base.py")

                with open(filepath) as f:
                    filedata = f.read()

                # Find the INSTALLED_APPS tuple. Then find the start of the
                # line for this add-on, and the line after it.
                insert = filedata.index(INSTALLED_APPS_START)
                insert = filedata.index(INSTALLED_APP % name, insert)
                end = filedata.index('\n', insert) + 1

                # Delete the line.
                filedata = filedata[:insert] + filedata[end:]

                # Now find CELERYBEAT_SCHEDULE, and the start of the
                # user-installed apps section. We do both to maximize the
                # probability of doing this correctly. Then, find the beginning
                # of the line that starts this add-on's task entries, and the
                # beginning of the line after the end of this add-on's task
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
                error = "%s while writing base.py. The Addon table was " \
                        "modified. You must manually edit settings/base.py " \
                        "and urls.py, and remove the base.html script tag, " \
                        "and delete the add-on's JavaScript directory."

                with open(filepath, 'w') as f:
                    f.write(filedata)

                # Now delete the add-on from the URLconf.
                error = "%s while writing urls.py. The Addon table and " \
                        "settings/base.py were updated. You must edit " \
                        "urls.py, and remove the base.html script tag, and " \
                        "delete the add-on's JavaScript directory."

                filepath = os.path.join(install_dir, "goldstone/urls.py")

                with open(filepath, 'r') as f:
                    filedata = f.read()

                insert = filedata.index(URLS_PY.format(name, row.url_root))
                end = insert

                for _ in range(URLS_PY.count('\n')):
                    end = filedata.index('\n', end) + 1

                filedata = filedata[:insert] + filedata[end:]

                with open(filepath, 'w') as f:
                    f.write(filedata)

                # Now remove the client's JavaScript files, and its base.html
                # script tag
                error = "%s while removing JavaScript files. You must " \
                        "delete the add-on's JavaScript directory."

                _remove_addon_javascript(name, install_dir)

                # Finally, expire all user tokens to force users to re-login,
                # which will reset their client-side localStorage 'addons'
                # object.
                error = "%s while trying to invalidate user tokens. You " \
                        "must clear the Token table."

                Token.objects.all().delete()

            except Exception as exc:       # pylint: disable=W0703
                # Oops! Tell the user what happened, because they'll have to
                # unwind things manually.
                abort(red(error % exc))
