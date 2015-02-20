"""Custom User model.

This needs to be in its own models file in order to avoid circular imports from
the Settings table.

User --+-- 1:1 --- Settings
       |
       +-- m:1 --- Tenant   (users and administrators)

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
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.db import models
from django.dispatch import receiver
from uuidfield import UUIDField

from goldstone.tenants.models import Tenant


class User(AbstractUser):
    """A variant of Django's default User model, with additional fields."""

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

    # This allows URLs to identify a row using a UUID value.
    uuid = UUIDField(auto=True)


@receiver(post_save, sender=User)
def _user_saved(sender, **kwargs):                # pylint: disable=W0613
    """Create a Settings row for a new User row.

    Note: Settings rows are deleted when their User row is deleted
    via Postgres cascading deletes; no need to use signals for that.

    :param sender: The sending model class
    :type sender: User
    :keyword instance: The actual instance being saved
    :type instance: User row
    :keyword created: True if a new model was created
    :type created: bool

    """
    from goldstone.accounts.models import Settings

    # If a new model was created...
    if kwargs["created"]:
        # Create a new Settings row for it.
        Settings.objects.create(user=kwargs["instance"])
