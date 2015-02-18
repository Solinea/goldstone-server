"""User profiles and tenants.

User preferences are stored in the Profile table. Tenants are defined,
including their settings, in the Tenant table.

User --+-- 1:1 --- Profile
       |
       +-- m:m --- Tenant

"""
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
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.db import models
from django.dispatch import receiver


class Profile(models.Model):
    """Additional user information."""

    # User row
    user = models.OneToOneField(settings.AUTH_USER_MODEL)

    def __unicode__(self):
        """Return a useful string."""

        return u'%s' % self.user.username         # pylint: disable=E1101


@receiver(post_save, sender=get_user_model())
def _user_saved(sender, **kwargs):                # pylint: disable=W0613
    """Create a Profile row for a new User row.

    Note: Profile rows are deleted when their User row is deleted via Postgres
    cascading deletes; no need to use signals for that.

    :param sender: The sending model class
    :type sender: User
    :keyword instance: The actual instance being saved
    :type instance: User row
    :keyword created: True if a new model was created
    :type created: bool

    """

    # If a new model was created...
    if kwargs["created"]:
        # Create a new Profile row for it.
        Profile.objects.create(user=kwargs["instance"])


class Tenant(models.Model):
    """Information about the tenants in the OpenStack cloud.

    We plan to store tenant settings here. If this becomes unwieldy, we'll
    normalize them into a separate table.

    """

    name = models.CharField(max_length=settings.TENANT_NAME_MAX_LENGTH,
                            unique=True,
                            help_text="The tenant's name")
    owner = models.CharField(max_length=settings.TENANT_OWNER_MAX_LENGTH,
                             help_text="The name of the tenant's owner")
    owner_contact = \
        models.TextField(blank=True,
                         help_text="The owner's contact information")
    administrators = \
        models.ManyToManyField(settings.AUTH_USER_MODEL,
                               null=True,
                               help_text="Admins for this tenant")

    def __unicode__(self):
        """Return a useful string."""

        return u'%s owned by %s' % (self.name, self.owner)
