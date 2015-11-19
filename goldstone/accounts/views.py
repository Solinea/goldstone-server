"""Account serializers and views."""
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
from djoser.serializers import UserRegistrationWithAuthTokenSerializer
from djoser.views import RegistrationView as DjoserRegistrationView

# Not a valid module-level symbol name, but this is the name djoser used, so
# we'll minimize the deltas between there and here.
User = get_user_model()     # pylint: disable=C0103


class RegistrationSerializer(UserRegistrationWithAuthTokenSerializer):
    """Subclass Djoser's corresponding serializer so we can prevent the row pk
    from being exposed in the endpoint's response.

    """

    # pylint: disable=C0111,W0232
    class Meta(UserRegistrationWithAuthTokenSerializer.Meta):
        model = User
        fields = \
            tuple(User.REQUIRED_FIELDS) + \
            (User.USERNAME_FIELD, "password", "auth_token")


class RegistrationView(DjoserRegistrationView):
    """Register a new user account.

    This subclasses Djoser's RegistrationView so we can attach our custom
    serializer.

    """

    def get_serializer_class(self):
        """Return the serializer class."""
        from djoser import settings

        if settings.get('LOGIN_AFTER_REGISTRATION'):
            return RegistrationSerializer
        else:
            raise NotImplementedError("Missing serializer.")
