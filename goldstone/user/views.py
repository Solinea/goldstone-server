"""Custom User model serializer and views."""
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
from django.contrib.auth import get_user_model
from djoser import views as djoser_views
from rest_framework.serializers import ModelSerializer


class UserSerializer(ModelSerializer):
    """A User table serializer that exposes a subset of fields that we want the
    user to be able to see."""

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = get_user_model()
        fields = ("username", "first_name", "last_name", "email",
                  "tenant_admin", "default_tenant_admin", "uuid")
        read_only_fields = ("tenant_admin", "default_tenant_admin", "uuid")


class UserView(djoser_views.UserView):
    """A copy of djoser.views.UserView that uses our serializer."""

    serializer_class = UserSerializer
