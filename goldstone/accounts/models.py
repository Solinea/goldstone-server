"""User profiles.

User preferences are stored in the Profile table. Tenants are defined,
including their settings, in the Tenant table.

User --+-- 1:1 --- Profile --- m:1 ---Tenant
       |                     (users and administrators)
       |
       +-- 1:1 --- Settings

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

from goldstone.tenants.models import Tenant


class Profile(models.Model):
    """Additional user information.

    These are items that we don't allow the user to change on his/her own
    account.

    """

    # User row
    user = models.OneToOneField(settings.AUTH_USER_MODEL)

    # The tenant to which this user belongs.
    tenant = models.ForeignKey(Tenant, null=True, blank=True)

    # If true, this user is an administrator of his/her tenant.
    tenant_admin = models.BooleanField(default=False)

    # If true, this is the default tenant_admin for new tenants. If more than
    # one row in the table has this set, a random one is used as the default
    # tenant_admin.
    default_tenant_admin = \
        models.BooleanField(default=False,
                            help_text="This is the default tenant_admin")

    def __unicode__(self):
        """Return a useful string."""

        return u'%s' % self.user.username         # pylint: disable=E1101


class Settings(models.Model):
    """User settings, a.k.a, preferences.

    These are items that we will allow the user to change on his/her own
    account.

    """

    # User row
    user = models.OneToOneField(settings.AUTH_USER_MODEL)

    class Meta:                     # pylint: disable=C0111,W0232,C1001
        verbose_name_plural = "settings"

    def __unicode__(self):
        """Return a useful string."""

        return u'%s' % self.user.username         # pylint: disable=E1101


@receiver(post_save, sender=get_user_model())
def _user_saved(sender, **kwargs):                # pylint: disable=W0613
    """Create a Profile and Settings row for a new User row.

    Note: Profile and Settings rows are deleted when their User row is deleted
    via Postgres cascading deletes; no need to use signals for that.

    :param sender: The sending model class
    :type sender: User
    :keyword instance: The actual instance being saved
    :type instance: User row
    :keyword created: True if a new model was created
    :type created: bool

    """

    # If a new model was created...
    if kwargs["created"]:
        # Create a new Profile and Settings row for it.
        Profile.objects.create(user=kwargs["instance"])
        Settings.objects.create(user=kwargs["instance"])
