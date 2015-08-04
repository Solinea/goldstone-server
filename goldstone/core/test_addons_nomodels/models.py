"""A models file without any PolyResource subclasses."""
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
from django.conf import settings
from django.db.models import CharField, IntegerField
from django_extensions.db.fields import UUIDField, CreationDateTimeField, \
    ModificationDateTimeField
from elasticsearch_dsl import String, Date, Integer, A
from elasticsearch_dsl.query import Q, QueryString
from goldstone.drfes.models import DailyIndexDocType
from goldstone.glogging.models import LogData, LogEvent
from picklefield.fields import PickledObjectField

# Get_glance_client is defined here for easy unit test mocking.
from goldstone.utils import utc_now, get_glance_client, get_nova_client, \
    get_cinder_client, get_keystone_client, get_cloud

import sys

# Aliases to make the Resource Graph definitions less verbose.
MAX = settings.R_ATTRIBUTE.MAX
MIN = settings.R_ATTRIBUTE.MIN
TO = settings.R_ATTRIBUTE.TO
TYPE = settings.R_ATTRIBUTE.TYPE
MATCHING_FN = settings.R_ATTRIBUTE.MATCHING_FN
EDGE_ATTRIBUTES = settings.R_ATTRIBUTE.EDGE_ATTRIBUTES

ALLOCATED_TO = settings.R_EDGE.ALLOCATED_TO
APPLIES_TO = settings.R_EDGE.APPLIES_TO
ASSIGNED_TO = settings.R_EDGE.ASSIGNED_TO
ATTACHED_TO = settings.R_EDGE.ATTACHED_TO
CONSUMES = settings.R_EDGE.CONSUMES
CONTAINS = settings.R_EDGE.CONTAINS
DEFINES = settings.R_EDGE.DEFINES
INSTANCE_OF = settings.R_EDGE.INSTANCE_OF
MEMBER_OF = settings.R_EDGE.MEMBER_OF
OWNS = settings.R_EDGE.OWNS
ROUTES_TO = settings.R_EDGE.ROUTES_TO
SUBSCRIBED_TO = settings.R_EDGE.SUBSCRIBED_TO
USES = settings.R_EDGE.USES


class MetricData(DailyIndexDocType):
    """Search interface for an agent generated metric."""

    INDEX_PREFIX = 'goldstone_metrics-'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'core_metric'

    @classmethod
    def stats_agg(cls):
        return A('extended_stats', field='value')

    @classmethod
    def units_agg(cls):
        return A('terms', field='unit')


class ReportData(DailyIndexDocType):

    INDEX_PREFIX = 'goldstone_reports-'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'core_report'


class EventData(DailyIndexDocType):
    """The model for logstash events data."""

    # The indexes we look for start with this string.
    INDEX_PREFIX = 'events'

    # Time sorting is on this key in the log.
    SORT = '-timestamp'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        # Return all document types.
        doc_type = ''
