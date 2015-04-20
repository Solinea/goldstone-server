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
from rest_framework.serializers import ModelSerializer


class UserSerializer(ModelSerializer):
    """A User table serializer that exposes a subset of fields to the user."""

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = get_user_model()

        # We use exclude, so that as per-user settings are defined, the code
        # will do the right thing with them by default.
        exclude = ("id",
                   "user_permissions",
                   "groups",
                   "is_staff",
                   "is_active",
                   "is_superuser",
                   "password",
                   "tenant",
                   )
        read_only_fields = ("tenant_admin",
                            "default_tenant_admin",
                            "uuid",
                            "date_joined",
                            "last_login",
                            )


class UserView(djoser_views.UserView):
    """A copy of djoser.views.UserView that uses our serializer."""

    serializer_class = UserSerializer
