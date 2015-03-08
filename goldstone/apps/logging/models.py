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
from elasticsearch_dsl import DocType, Search, query
from goldstone.models import es_indices, es_conn

logger = logging.getLogger(__name__)


class LogData(DocType):
    """Logstash log entry model (intended to be read-only)."""

    _INDEX_PREFIX = 'logstash-'

    class Meta:
        doc_type = 'syslog'

    @classmethod
    def search(cls):
        """Gets a generic Log search object.

        See elasticsearch-dsl for parameter information.
        """

        return Search(
            using=cls._doc_type.using,
            index=es_indices(cls._INDEX_PREFIX),
            doc_type={cls._doc_type.name: cls.from_es},
        ).using(es_conn())

    @classmethod
    def ranged_log_search(cls, start=None, end=None, hosts=[],
                          interval=None,
                          by_level=True):
        """ Returns a search with time range and hosts list terms, and
        optionally, aggregations by date histogram, then log level."""

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

        # add an aggregation for time intervals
        # if interval is not None:
        #    search.aggs.bucket('by_interval', "date_histogram",
        #        field="@timestamp",
        #        interval=interval,
        #        min_doc_count=0)

        # add an aggregation for loglevels if requested.
        # if by_level and interval is not None:
        #    search.aggs['by_interval'].bucket('by_level', 'terms',
        #                                      field='loglevel',
        #                                      min_doc_count=0)
        # elif by_level:
        #     search.aggs.bucket('by_level', 'terms',
        #                        field='loglevel',
        #                        min_doc_count=0)

        return search.sort({"@timestamp": {"order": "desc"}}).using(es_conn())
