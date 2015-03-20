"""Core models."""
# Copyright 2014 - 2015 Solinea, Inc.
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
import json
from django.db.models import CharField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
import logging
from polymorphic import PolymorphicModel
from goldstone.apps.drfes.models import DailyIndexDocType
from goldstone.apps.logging.models import LogData, LogEvent
from goldstone.utils import utc_now

from elasticsearch_dsl.query import Q, QueryString

logger = logging.getLogger(__name__)


#
# Goldstone Agent Metrics and Reports
#

class MetricData(DailyIndexDocType):
    """Search interface for an agent generated metric."""

    INDEX_PREFIX = 'goldstone_metrics-'

    class Meta:
        doc_type = 'core_metric'


class ReportData(DailyIndexDocType):

    INDEX_PREFIX = 'goldstone_reports-'

    class Meta:
        doc_type = 'core_report'

#
# This is the beginning of the new polymorphic resource model support
#


class PolyResource(PolymorphicModel):
    """
    The base type for resources in Goldstone.
    """
    id = UUIDField(
        version=1,
        auto=True,
        primary_key=True)

    name = CharField(
        max_length=255,
        unique=True)

    created = CreationDateTimeField(
        editable=False,
        blank=True,
        default=utc_now)

    updated = ModificationDateTimeField(
        editable=True,
        blank=True)

    def _hashable(self):
        from rest_framework.renderers import JSONRenderer
        from .serializers import PolyResourceSerializer

        return JSONRenderer().render(PolyResourceSerializer(self).data)

    def logs(self):
        """Retrieve a search object for logs related to this resource.

        The default implementation just looks for the name of the resource
        in any of the fields.
        """
        query = Q(QueryString(query=self.name))
        return LogData.search().query(query)

    def events(self):
        """Retrieve a search object for events related to this resource.

        The default implementation looks for logging event types with this
        resource name appearing in any field."""

        # this protects our hostname from being tokenized
        escaped_name = r'"' + self.name + r'"'
        name_query = Q(QueryString(query=escaped_name, default_field="_all"))
        return LogEvent.search().query(name_query)

    def fresh_config(self):
        """Retrieve configuration from source system for this resource."""

        raise NotImplementedError("Override this method in a subclass")

    def historical_config(self):
        """Retrieve configuration from ES for this resource."""

        raise NotImplementedError("Override this method in a subclass")

