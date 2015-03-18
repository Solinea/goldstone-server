"""Logging models."""
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

import logging
from arrow import Arrow
from elasticsearch_dsl import Search, query
from goldstone.apps.drfes.models import DailyIndexDocType

logger = logging.getLogger(__name__)


class LogData(DailyIndexDocType):
    """Logstash log entry model (intended to be read-only)."""

    class Meta:
        doc_type = 'syslog'

    @classmethod
    def ranged_log_search(cls, start=None, end=None, hosts=[]):
        """ Returns a search with time range and hosts list terms"""

        import arrow

        start = arrow.get(0) if start == '' else start
        end = arrow.utcnow() if end == '' else end

        if end is not None:
            assert isinstance(end, Arrow), "end is not an Arrow object"

        if start is not None:
            assert isinstance(start, Arrow), "start is not an Arrow object"

        search = cls.search()

        if start is not None and end is not None:
            search = search.query(
                'range',
                ** {'@timestamp':
                    {'lte': end.isoformat(),
                     'gte': start.isoformat()}})

        elif start is not None and end is None:
            search = search.query(
                'range',
                ** {'@timestamp': {'gte': start.isoformat()}})

        elif start is None and end is not None:
            search = search.query(
                'range',
                ** {'@timestamp': {'lte': end.isoformat()}})

        if len(hosts) != 0:
            # the double underscore is translated to .
            search = search.query(query.Terms(host__raw=hosts))

        return search

    @classmethod
    def ranged_log_agg(cls, base_queryset, interval='1d', per_host=True):
        """ Returns an aggregations by date histogram and maybe log level.

        :type base_queryset: Search
        :param base_queryset: search to use as basis for aggregation
        :type interval: str
        :param interval: valid ES time interval such as 1m, 1h, 30s
        :type per_host: bool
        :param per_host: aggregate by host inside the time aggregation?
        :rtype: object
        :return: the (possibly nested) aggregation
        """

        assert isinstance(interval, basestring), 'interval must be a string'

        # we are not interested in the actual docs, so use the count search
        # type.
        search = base_queryset.params(search_type="count")

        # add an aggregation for time intervals
        search.aggs.bucket('per_interval', "date_histogram",
                           field="@timestamp",
                           interval=interval,
                           min_doc_count=0)

        # add a top-level aggregation for levels
        search.aggs.bucket('per_level', "terms",
                           field="syslog_severity",
                           min_doc_count=0)

        if per_host:
            # add a top-level aggregation for hosts
            search.aggs.bucket(
                'per_host', "terms",
                field="host.raw",
                min_doc_count=0)

            # nested aggregation per interval, per host
            search.aggs['per_interval'].bucket(
                'per_host', 'terms',
                field='host.raw',
                min_doc_count=0)

            search.aggs['per_interval']['per_host'].bucket(
                'per_level', 'terms',
                field='syslog_severity',
                min_doc_count=0)
        else:
            search.aggs['per_interval'].bucket(
                'per_level', 'terms',
                field='syslog_severity',
                min_doc_count=0)

        response = search.execute().aggregations
        return response


class LogEvent(LogData):
    """Logstash log entry model (intended to be read-only)."""

    LOG_EVENT_TYPES = ['OpenStackSyslogError', 'GenericSyslogError']

    class Meta:
        doc_type = 'syslog'

    @classmethod
    def search(cls):
        """Return a search object with a log event query clause. """

        from elasticsearch_dsl import Q
        from elasticsearch_dsl.query import Terms

        search = super(LogEvent, cls).search()
        event_type_query = Q(Terms(event_type__raw=cls.LOG_EVENT_TYPES))

        return search.query(event_type_query)
