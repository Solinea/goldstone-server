"""Core serializers."""
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
import logging
from rest_framework import serializers
from goldstone.core.models import SavedSearch, AlertSearch, Alert
from goldstone.drfes.serializers import ReadOnlyElasticSerializer, \
    SimpleAggSerializer
from .models import PolyResource

logger = logging.getLogger(__name__)

# pylint: disable=W0223


class PolyResourceSerializer(serializers.ModelSerializer):
    """The PolyResource class serializer."""

    class Meta:             # pylint: disable=C1001,C0111,W0232
        model = PolyResource
        lookup_field = 'uuid'
        exclude = ['polymorphic_ctype']


class PassthruSerializer(serializers.Serializer):
    """A serializer for DRF views where no work is needed."""

    def to_representation(self, instance):
        """Return an already-serialized object."""

        return instance


class SavedSearchSerializer(serializers.ModelSerializer):
    """The Defined Search serializer."""

    class Meta:                 # pylint: disable=C0111,C1001,W0232

        model = SavedSearch


class AlertSearchSerializer(serializers.ModelSerializer):
    """The Defined Alert Search serializer."""

    class Meta:                 # pylint: disable=C0111,C1001,W0232

        model = AlertSearch
