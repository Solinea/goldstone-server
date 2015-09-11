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

from django.conf import settings
from django.contrib.auth import get_user_model
from djoser import views as djoser_views
from goldstone.tenants.models import Tenant
from rest_framework.serializers import ModelSerializer
from rest_framework.fields import CharField

logger = logging.getLogger(__name__)


class UserSerializer(ModelSerializer):
    """Expose a subset of the available User fields, treat some as read-only,
    and allow tenant_adminds to read/write their Cloud row.

    This presently handles at most one Goldstone tenant per user, and at most
    one OpenStack cloud per tenant.

    """

    # Extra fields that are not in the User model, which correspond to Tenant
    # and Cloud table fields. These being here result in their display in the
    # swagger-ui documentation.
    tenant_name = CharField(required=False,
                            read_only=True,
                            max_length=settings.TENANT_NAME_MAX_LENGTH)
    os_name = CharField(required=False,
                        max_length=settings.OS_NAME_MAX_LENGTH)
    os_username = CharField(required=False,
                            max_length=settings.OS_USERNAME_MAX_LENGTH)
    os_password = CharField(required=False,
                            max_length=settings.OS_PASSWORD_MAX_LENGTH)
    os_auth_url = CharField(required=False,
                            max_length=settings.OS_AUTH_URL_MAX_LENGTH)

    def to_representation(self, value):
        """Include Goldstone tenant and cloud information if the user is a
        tenant_admin."""
        from django.core.exceptions import ObjectDoesNotExist

        result = super(UserSerializer, self).to_representation(value)

        if result["tenant_admin"] and result["tenant"]:
            # Get the tenant row.
            try:
                row = Tenant.objects.get(pk=result["tenant"])
            except ObjectDoesNotExist:
                # A tenant_admin without a valid tenant row. Return the User
                # data without the tenant.
                logger.warning("Tenant_admin without a tenant: %s", result)
                del result["tenant"]
                return result

            # Add the tenant's fields.
            result["tenant_name"] = row.name

            # Get the Cloud under this tenant, being careful to not raise an
            # exception if it's missing. The aliasing here is ugly.
            if row.cloud_set.count() > 0:
                row = row.cloud_set.all()[0]
                result["os_name"] = row.tenant_name
                result["os_username"] = row.username
                result["os_password"] = row.password
                result["os_auth_url"] = row.auth_url

        # If the tenant pk field exists, it'll contain a pk, which we don't
        # want to expose. Delete it.
        del result["tenant"]

        return result

    def update(self, instance, validated_data):
        """Update the corresponding Cloud row for this User, if she is a
        tenant_admin AND changed any Cloud fields.

        TODO: Add this functionality to the create() path.

        """

        # Each entry is (API name for an updateable Cloud table field, real
        # name for a Cloud table field).
        CLOUD_FIELDS = [("os_name", "tenant_name"),
                        ("os_username", "username"),
                        ("os_password", "password"),
                        ("os_auth_url", "auth_url"),
                        ]

        # Update the User row
        instance = super(UserSerializer, self).update(instance, validated_data)

        # If the user is a tenant_admin, and the tenant exists...
        if instance.tenant_admin and instance.tenant:
            # Get the associated Cloud, if it exists. It's not an error if it
            # doesn't exist.
            if instance.tenant.cloud_set.count() > 0:
                row = instance.tenant.cloud_set.all()[0]

                # For every updateable Cloud row field, if it's in the update
                # data, update the row's corresponding field.
                for api_name, field_name in CLOUD_FIELDS:
                    if api_name in validated_data:
                        setattr(row, field_name, validated_data[api_name])

                row.save()

        return instance

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = get_user_model()

        # We use exclude so that the code will correctly handle new per-user
        # settings added to the User model.
        exclude = ("id",
                   "user_permissions",
                   "groups",
                   "is_staff",
                   "is_active",
                   "password",
                   )

        read_only_fields = ("tenant_admin",
                            "default_tenant_admin",
                            "uuid",
                            "date_joined",
                            "last_login",
                            "tenant",
                            )


class UserView(djoser_views.UserView):
    """Access information about the logged-in Goldstone user."""

    serializer_class = UserSerializer
