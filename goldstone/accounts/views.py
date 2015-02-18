"""Account views."""
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
        fields = ["name", "owner", "owner_contact", "administrators"]


class TenantsViewSet(ModelViewSet):
    """Provide all of the /accounts/tenants views.

    Today, this acts upon only the Tenant table. Some of the methods will
    eventually need to manipulate the target cloud.

    """

    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    lookup_field = "name"

    def perform_create(self, serializer):
        """Perform a create Tenant request.

        In self.request.data there will be name, owner, and admin.

        """
        from django.contrib.auth import get_user_model

        # We'll create this tenant with an admin user, if specified.
        #
        # TODO: If not, should we create it with a default admin?
        admin = self.request.data.get("admin")

        # Create the tenant, optionally with an admin.
        tenant = serializer.save(owner=self.request.data["owner"],
                                 name=self.request.data["name"])
        if admin:
            admin = get_user_model().objects.get(username=admin)
            tenant.administrators.add(admin)

        # Send registration email to the admins' email addresses.
        # TBD
