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
from django.contrib.auth import get_user_model
from djoser import views as djoser_views
from goldstone.tenants.models import Tenant
from rest_framework.serializers import ModelSerializer
from rest_framework.relations import RelatedField


class UserSerializer(ModelSerializer):
    """Expose a subset of the available User fields, treats some as read-only,
    and provides read/write access to a Tenant row for tenant_admins."""

    def to_internal_value(self, data):
        from django.core.exceptions import ObjectDoesNotExist

        result = super(UserSerializer, self).to_internal_value(data)
        import pdb; pdb.set_trace()
        return result

    def to_representation(self, value):
        """Include detailed tenant information if the user is a tenant_admin,
        otherwise nothing."""

        result = super(UserSerializer, self).to_representation(value)

        if result["tenant_admin"]:
            # Remember the tenant row, delete the pk field.
            row = Tenant.objects.get(pk=tenant_pk)
            del result["tenant"]

            # Add the tenant's fields.
            result["
        else:
            del result["tenant"]

        import pdb; pdb.set_trace()
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
