"""Tenant views."""
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
import logging

from django.contrib.auth import get_user_model
from rest_framework.permissions import BasePermission
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework_extensions.mixins import NestedViewSetMixin

from goldstone.utils import django_admin_only
from goldstone.user.views import UserSerializer as AccountsUserSerializer
from .models import Tenant

logger = logging.getLogger(__name__)

# We need to get at the AccountsUserSerializer's fields property.  This appears
# to be the only way to do it. It's a hack.
_hack_object = AccountsUserSerializer()
_hack_fields = _hack_object.fields.keys()


class UserSerializer(AccountsUserSerializer):
    """A User table serializer that's used when accessing a user as a "child"
    of his/her tenant. E.g., /tenants/<id>/user/<id>.

    This adds the Tenant relationship, and exposes more fields.

    """

    class Meta:          # pylint: disable=C1001,C0111,W0232
        model = get_user_model()
        fields = _hack_fields + ["tenant"]


class TenantSerializer(ModelSerializer):

    """The Tenant model serializer."""

    class Meta:          # pylint: disable=C1001,C0111,W0232
        model = Tenant
        fields = ["name", "owner", "owner_contact", "uuid"]
        read_only_fields = ('uuid', )


class DjangoOrTenantAdminPermission(BasePermission):
    """A custom permissions class that allows access if the user is a Django
    Admin, or a tenant_admin for the Tenant row being accessed."""

    def has_object_permission(self, request, view, obj):
        """Override the permissions check for single Tenant row access.

        :return: True if the request should be granted, False otherwise
        :rtype: bool

        """

        user = request.user
        return user.is_staff or (user.tenant_admin and user.tenant == obj)


class BaseViewSet(NestedViewSetMixin, ModelViewSet):
    """A base class for this app's Tenant and User ViewSets."""

    lookup_field = "uuid"

    def get_object(self):
        """Return the desired object for this request.

        Because the API's selection string is a UUID, we have to
        do a little extra work to filter by UUID. Hence, we have to
        override get_object().

        """
        from uuid import UUID

        # Pad the UUID hexadecimal value, extracted from the request URL, to 32
        # hex digits. Then create a UUID object with it.
        value = UUID(hex=self.kwargs[self.lookup_field].zfill(32))

        # Return the object having this UUID.
        return self.get_queryset().get(**{self.lookup_field: value})


class TenantsViewSet(BaseViewSet):
    """Provide all of the /tenants views."""

    serializer_class = TenantSerializer
    permission_classes = (DjangoOrTenantAdminPermission, )

    def get_queryset(self):
        """Return the queryset for list views."""

        return Tenant.objects.all()

    @django_admin_only
    def perform_create(self, serializer):
        """Add the system's default tenant_admin as the tenant_admin, and
        member, of the tenant we are creating.

        """

        # Do what the superclass' perform_create() does, to get the newly
        # created row.
        tenant = serializer.save()

        # Find the default tenant_admin. Use a filter in case there's
        # erroneously more than one in the system.
        admin_user = get_user_model().objects.filter(default_tenant_admin=True)

        if not admin_user:
            # There should always be a default tenant_admin.
            logger.error("There are no default tenant_admins in the system."
                         " Using the Django administrator instead.")
            admin_user = self.request.user
        elif admin_user.count() > 1:
            # More than one default tenant_admin is odd, but we'll continue.
            logger.warning("The system has more then one default tenant admin."
                           " There must be Only One: %s",
                           admin_user)
            admin_user = admin_user[0]
        else:
            # We found the single default tenant_admin.
            admin_user = admin_user[0]

        # Insert the default tenant_admin into the tenant, and save it.
        admin_user.tenant_admin = True
        admin_user.tenant = tenant
        admin_user.save()

    @django_admin_only
    def list(self, request, *args, **kwargs):
        """Provide a collection-of-objects GET response, for Django admins."""
        from rest_framework.response import Response

        # Return all the tenants to this Django admin.
        instance = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(instance)

        serializer = \
            self.get_serializer(instance, many=True) if page is None else \
            self.get_pagination_serializer(page)

        return Response(serializer.data)


class UserViewSet(BaseViewSet):
    """A ViewSet for the User table, which is used only in this app's
    "parent/child" views."""

    serializer_class = UserSerializer

    def get_queryset(self):
        """Return the queryset for list views."""

        return get_user_model().objects.all()
