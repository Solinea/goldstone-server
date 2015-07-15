"""Dynamic application models."""
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
import logging

from django.core.urlresolvers import resolve    # Defined here for easy mocking
from django.db import models
from django_extensions.db.fields import CreationDateTimeField, \
    ModificationDateTimeField

logger = logging.getLogger(__name__)


def _error(row):
    """Log an error for a problem found in an installable application row.

    :param row: An installable app that should exist, but doesn't.
    :type row: Application

    """

    logger.error('Installable application %s has an "%s" url_root that '
                 'isn\'t in Goldstone\'s URLconf. Delete it, or install '
                 'the missing application.',
                 row,
                 row.url_root)


class ApplicationManager(models.Manager):
    """Add additional table-level functionality to the Application manager."""

    def check_table(self, error_handler=_error):
        """Find and report Application table inconsistencies.

        :keyword error_handler: A callable that takes one argument, an
                                Application row. This is called when a row
                                has a problem.
        :type error_handler: Callable
        :return: The total number of apps in the table (taken after checking
                 the table), and the bad rows that were found. The
                 error_handler was called on each bad row.
        :rtype: (int, list of str)

        """
        from django.core.urlresolvers import Resolver404

        result = []

        # For every Application row...
        for row in self.model.objects.all():
            # Create the application's root relative URL. The url_root column
            # should be only the root without leading or trailing slashes, or
            # an "http://", but we'll be liberal in what we accept.
            url = row.url_root.replace("http://", '').replace("https://", '')
            url = '/' + url.strip('/') + '/'

            # Test this url root
            try:
                resolve(url)
            except Resolver404:
                # This URL root doesn't exist. Process the error and iterate.
                result.append(str(row))
                error_handler(row)

        return (self.model.objects.count(), result)


class Application(models.Model):
    """Optional applications that are installed on-site by the user."""

    name = models.CharField(unique=True, max_length=60)
    version = models.CharField(max_length=20,
                               help_text='Don\'t include a leading "V".')
    manufacturer = models.CharField(max_length=80)

    url_root = \
        models.CharField(unique=True,
                         max_length=40,
                         help_text="The urlconf is rooted here. "
                         "Don't use leading or trailing slashes.")

    notes = models.TextField(blank=True,
                             help_text="Instructions, release notes, etc.")

    installed_date = CreationDateTimeField()
    updated_date = ModificationDateTimeField()

    objects = ApplicationManager()

    def __unicode__(self):
        """Return a useful string."""

        return "%s v%s from %s, rooted at %s" % \
            (self.name, self.version, self.manufacturer, self.url_root)
