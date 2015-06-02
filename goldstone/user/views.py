"""Custom User model serializer and views."""
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

from django.contrib.auth import get_user_model
from djoser import views as djoser_views
from goldstone.tenants.models import Tenant
from rest_framework.serializers import ModelSerializer

logger = logging.getLogger(__name__)


class UserSerializer(ModelSerializer):
    """Expose a subset of the available User fields, treats some as read-only,
    and provides read/write access to a Tenant row for tenant_admins.

    This presently handles at most one Goldstone tenant per user, and at most
    one OpenStack cloud per tenant.

    """

    def to_internal_value(self, data):

        result = super(UserSerializer, self).to_internal_value(data)
        import pdb; pdb.set_trace()
        return result

    def to_representation(self, value):
        """Include detailed tenant information if the user is a tenant_admin,
        otherwise nothing."""
        from django.core.exceptions import ObjectDoesNotExist

        result = super(UserSerializer, self).to_representation(value)

        if result["tenant_admin"] and result["tenant"]:
            # Get the tenant row.
            try:
                row = Tenant.objects.get(pk=result["tenant"])
            except ObjectDoesNotExist:
                # Odd condition of a tenant_admin without a valid tenant row.
                # Return the User data now, without the tenant.
                logger.warning("Tenant_admin with a tenant: %s", result)
                del result["tenant"]
                return result

            # Add the tenant's fields.
            result["tenant_name"] = row.name

            # Get the Cloud under this tenant, being careful to throw an
            # exception if it's not present.  The aliasing here is a bit ugly.
            row = row.cloud_set.all()[:1]
            if row:
                row = row[0]
                result["os_name"] = row.tenant_name
                result["os_username"] = row.username
                result["os_password"] = row.password
                result["os_auth_url"] = row.auth_url

        # Whether the tenant pk field exists with a value, or contains None,
        # delete it.
        del result["tenant"]

        return result

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = get_user_model()

        # We use exclude, so that the code will correctly handle per-user
        # settings as they are defined in the User model.
        exclude = ("id",
                   "user_permissions",
                   "groups",
                   "is_staff",
                   "is_active",
                   "is_superuser",
                   "password",
                   )

        read_only_fields = ("tenant_admin",
                            "default_tenant_admin",
                            "uuid",
                            "date_joined",
                            "last_login",
                            )


class UserView(djoser_views.UserView):

    """Access information about the logged-in Goldstone user."""

    serializer_class = UserSerializer
