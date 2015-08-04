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
from elasticsearch_dsl import A
from goldstone.drfes.models import DailyIndexDocType


class MetricData(DailyIndexDocType):
    """Search interface for an agent generated metric."""

    INDEX_PREFIX = 'goldstone_metrics-'

    class Meta:          # pylint: disable=C0111,W0232,C1001
        doc_type = 'core_metric'

    @classmethod
    def stats_agg(cls):
        """Meaningless."""
        return A('extended_stats', field='value')

    @classmethod
    def units_agg(cls):
        """Meaningless."""
        return A('terms', field='unit')


class ReportData(DailyIndexDocType):
    """Meaningless."""

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
