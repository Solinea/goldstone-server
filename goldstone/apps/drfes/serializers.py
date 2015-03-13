"""DRFES serialiers."""
# Copyright '2015' Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from rest_framework.serializers import Serializer


class ReadOnlyElasticSerializer(Serializer):
    """Basic serializer for an ES object.

    Uses the to_dict() method and removed fields listed in the exclude Meta
    field.
    """

    class Meta:
        exclude = ()

    def to_representation(self, instance):
        """Convert a record to a representation suitable for rendering.

        :type instance: Result
        :param instance: An instance from an ES search response
        :rtype: dict
        :return: the response minus exclusions as a dict
        """

        obj = instance.to_dict()

        for excl in self.Meta.exclude:
            try:
                del obj[excl]
            except KeyError:
                # dynamic docs may not have all fields.
                pass

        return obj
