"""Custom User model.

User --- m:1 --- Tenant   (users and administrators)

"""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.db import models
from django.dispatch import receiver
from django_extensions.db.fields import UUIDField

from goldstone.tenants.models import Tenant


class User(AbstractUser):
    """A variant of Django's default User model, with additional fields."""

    # The tenant to which this user belongs. 1 Tenant: m User.
    tenant = models.ForeignKey(Tenant, null=True, blank=True)

    # If true, this user is an administrator of his/her tenant.
    tenant_admin = models.BooleanField(default=False)

    # If true, this is the default tenant_admin for new tenants. If more than
    # one row in the table has this set, a random one is used as the default
    # tenant_admin.
    default_tenant_admin = models.BooleanField(
        default=False,
        help_text="The default tenant admin for new tenants")

    # This allows URLs to identify a row using a UUID value.
    uuid = UUIDField(auto=True)

    # Define per-user settings below this comment. Defining them in another
    # table with a 1:1 relationship to this one would be more normalized, and a
    # common Django idiom. However, REST doesn't play well with 1:1 resource
    # relationships. The pragmatic solution is to define user settings in this
    # table until such time as they become unwieldy.

    def __unicode__(self):
        """Return a useful string."""

        return u'%s' % self.username


@receiver(post_save, sender=User)
def _user_saved(sender, **kwargs):                # pylint: disable=W0613
    """Create an authentication token for a new User row.

    Note: Token rows are deleted when their User row is deleted, via Postgres
    cascading deletes. There's no need to use signals for deletes.

    :param sender: The sending model class
    :type sender: User
    :keyword instance: The actual instance being saved
    :type instance: User row
    :keyword created: True if a new model was created
    :type created: bool

    """
    from rest_framework.authtoken.models import Token

    # If a new model was created...
    if kwargs["created"]:
        # Create a new authentication token.
        Token.objects.create(user=kwargs["instance"])
