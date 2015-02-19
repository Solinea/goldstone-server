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

    def list(self, request, *args, **kwargs):
        """Provide a collection-of-objects GET response, for Django admins."""
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import PermissionDenied

        if request.user.is_staff:
            # Return all the tenants to this Django admin.
            instance = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(instance)

            serializer = \
                self.get_serializer(instance, many=True) if page is None else \
                self.get_pagination_serializer(page)

            return Response(serializer.data)
        else:
            # Return nothing to this non-admin user.
            raise PermissionDenied

    def perform_create(self, serializer):
        """Perform a create Tenant request.

        In self.request.data there will be name, owner, and admin.

        """
        from django.contrib.auth import get_user_model

        # We'll create this tenant with an admin user, if specified.
        admin = self.request.data.get("admin")

        # Create the tenant, optionally with an admin.
        tenant = serializer.save(owner=self.request.data["owner"],
                                 name=self.request.data["name"])
        if admin:
            admin = get_user_model().objects.get(username=admin)
            tenant.administrators.add(admin)

        # Send registration email to the admins' email addresses.
        # TBD
