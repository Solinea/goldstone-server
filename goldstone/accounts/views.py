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

from django.contrib.auth import get_user_model
from djoser import views as djoser_views
from rest_framework import generics, serializers
from .models import Settings

logger = logging.getLogger(__name__)


class SettingsSerializer(serializers.ModelSerializer):
    """The serializer for the Settings table."""

    class Meta:                         # pylint: disable=C0111,W0232,C1001
        model = Settings
        fields = []


class SettingsView(generics.RetrieveUpdateAPIView):
    """The endpoint for retreiving and updating account settings that can be
    modified by the user."""

    model = Settings
    serializer_class = SettingsSerializer

    def get_object(self, *args, **kwargs):         # pylint: disable=W0613
        """Return this user's Settings row."""

        return self.request.user.settings


class UserSerializer(serializers.ModelSerializer):
    """A copy of djoser.serializers.UserSerializer that does not expose the
    row pk."""

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = get_user_model()
        fields = ("username", "first_name", "last_name", "email")


class UserView(djoser_views.UserView):
    """A copy of djoser.views.UserView that uses our serializer."""

    serializer_class = UserSerializer
