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

from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from goldstone.utils import django_admin_only
from .models import Tenant

logger = logging.getLogger(__name__)


class TenantSerializer(ModelSerializer):
    """The Tenant model serializer."""

    class Meta:          # pylint: disable=C1001,C0111,W0232
        model = Tenant
        fields = ["name", "owner", "owner_contact"]


class TenantsViewSet(ModelViewSet):
    """Provide all of the /tenants views."""

    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    # lookup_field = "name"

    def get_queryset(self):
        """Return the queryset for list views."""

        return Tenant.objects.all()

    @django_admin_only
    def perform_create(self, serializer):
        """Add the system's default tenant_admin as the tenant_admin, and
        member, of the tenant we are creating.

        """
        from goldstone.accounts.models import Profile

        # Do what the superclass' perform_create() does, to get the newly
        # created row.
        tenant = serializer.save()

        # Get the tenant_admin. Use a filter in case there's erroneously more
        # than one in the system.
        admin_profile = Profile.objects.filter(default_tenant_admin=True)

        if not admin_profile:
            # No default tenant_admins is an error.
            logger.error("There are no default tenant_admins in the system."
                         " Using the Django administrator instead.")
            admin_profile = self.request.user.profile
        elif admin_profile.count() > 1:
            # More than one default tenant_admin is odd, but we'll continue.
            logger.warning("The system has more then one default tenant admin."
                           " There must be Only One: %s",
                           admin_profile)
            admin_profile = admin_profile[:1]
        else:
            # We found the default tenant_admin for this system.
            admin_profile = admin_profile[0]

        # Insert the default tenant_admin into the tenant and save it.
        admin_profile.tenant_admin = True
        admin_profile.tenant = tenant
        admin_profile.save()

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
