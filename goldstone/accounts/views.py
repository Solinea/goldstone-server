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
from rest_framework import generics, permissions, status, response, serializers

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = tuple(User.REQUIRED_FIELDS) + (
            User._meta.pk.name,
            User.USERNAME_FIELD,
        )
        read_only_fields = (
            User.USERNAME_FIELD,
        )


class UserView(generics.RetrieveUpdateAPIView):
    """
    Use this endpoint to retrieve/update user.
    """
    model = get_user_model()
    serializer_class = serializers.UserSerializer
    permission_classes = (
        permissions.IsAuthenticated,
    )

    def get_object(self, *args, **kwargs):
        return self.request.user


    
