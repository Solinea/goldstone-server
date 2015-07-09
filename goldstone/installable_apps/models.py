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
from django.db import models
from django_extensions.db.fields import CreationDateTimeField, \
    ModificationDateTimeField


class Application(models.Model):
    """Information about optional applications that are installed on-site by
    the user."""

    name = models.CharField(max_length=60)
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

    class Meta:              # pylint: disable=W0232,C1001,C0111
        unique_together = ("name", "manufacturer")

    def __unicode__(self):
        """Return a useful string."""

        return "%s v%s from %s, rooted at %s" % \
            (self.name, self.version, self.manufacturer, self.url_root)
