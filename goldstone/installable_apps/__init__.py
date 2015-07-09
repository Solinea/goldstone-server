"""Installable applications."""
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

logger = logging.getLogger(__name__)


def _error(row):
    """Log an error for an installable application.

    :param row: An installable app that should exist, but doesn't.
    :type row: Application

    """

    logger.error('Installable application %s has an "%s" url_root that isn\'t'
                 'in Goldstone\'s URLconf. Delete it, or install the missing '
                 'application.',
                 row,
                 row.url_root)


def startup(error_handler=_error):
    """Find and process any Application table inconsistencies.

    The runserver command will cause this to be executed twice upon initial
    startup, and once each time models are re-validated. In production, it is
    executed once upon wsgi startup.

    :keyword error_handler: A callable that takes one argument, an Application
                            row. This is called when a row is found that
                            references a non-existent installable app.
    :type error_handler: Callable

    """
    from django.core.urlresolvers import resolve, Resolver404
    from .models import Application

    # For every Application row...
    for row in Application.objects.all():
        # Create the application's root relative URL. The url_root column
        # should be only the root without leading or trailing slashes, or an
        # "http://", but we'll be liberal in what we correctly process.
        url = row.url_root.replace("http://", '').replace("https://", '')
        url = '/' + url.strip('/') + '/'

        # Test this url root
        try:
            resolve(url)
        except Resolver404:
            # This application's URL root doesn't exist. Process the error and
            # continue to the next application.
            error_handler(row)


startup()
