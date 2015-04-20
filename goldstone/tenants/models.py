"""Tenant and Cloud models."""
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
from django.conf import settings
from django.db import models
from django_extensions.db.fields import UUIDField


class Tenant(models.Model):
    """Information about the tenants in the OpenStack cloud.

    If storing tenant settings here becomes unwieldy, we'll normalize them into
    a separate table.

    """

    name = models.CharField(max_length=settings.TENANT_NAME_MAX_LENGTH,
                            unique=True)
    owner = models.CharField(max_length=settings.TENANT_OWNER_MAX_LENGTH,
                             help_text="The name of the tenant's owner")
    owner_contact = \
        models.TextField(blank=True,
                         help_text="The owner's contact information")

    # This allows URLs to identify a row using a UUID value.
    uuid = UUIDField(auto=True)

    def __unicode__(self):
        """Return a useful string."""

        return u'%s owned by %s' % (self.name, self.owner)


class Cloud(models.Model):
    """Information about clouds, e.g., OpenStack, which are contained within a
    Goldstone tenant."""

    # This is the cloud's name, not the name of the owning Goldstone tenant!
    tenant_name = models.CharField(max_length=settings.OS_NAME_MAX_LENGTH)
    username = models.CharField(max_length=settings.OS_USERNAME_MAX_LENGTH)
    password = models.CharField(max_length=settings.OS_PASSWORD_MAX_LENGTH)
    auth_url = models.CharField(max_length=settings.OS_AUTH_URL_MAX_LENGTH)

    tenant = models.ForeignKey(Tenant)

    # This allows URLs to identify a row using a UUID value.
    uuid = UUIDField(auto=True)

    class Meta:             # pylint: disable=C1001,C0111,W0232
        unique_together = ("tenant_name", "username", "tenant")

    def __unicode__(self):
        """Return a useful string."""

        return u'%s, contained in %s' % (self.tenant_name, self.tenant.name)
