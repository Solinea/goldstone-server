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

import logging

logger = logging.getLogger(__name__)


def _format_log_count(bucket):
    """Helper takes an aggregation bucket and returns a friendlier dict."""
    return {bucket['key']: dict(
        (level['key'], level['doc_count'])
        for level in bucket['by_level']['buckets']
    )}


def log_counts(start=None, end=None, hosts=[], index_prefix='logstash-'):
    """Summarizes the count of log entries by host and level.

    :type start: Arrow or None
    :param start: the start time for the range to inspect, None is all time
    :type end: Arrow or None
    :param end: the end time for the range to inspect, None is now
    :type hosts: list
    :param hosts: limit the counts to a list of hosts, empty will return all
    :type index_prefix: str
    :param index_prefix: the prefix of the ES indices to search
    :return: a JSON doc
    """

    import json
    from arrow import Arrow
    from elasticsearch_dsl import Search, query
    from goldstone.models import es_indices

    if end is not None:
        assert isinstance(end, Arrow), "end is not an Arrow object"

    if start is not None:
        assert isinstance(start, Arrow), "start is not an Arrow object"

    search = Search(index=es_indices(index_prefix))

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

    search.aggs.bucket('by_host', 'terms', field='host.raw'). \
        metric('by_level', 'terms', field='loglevel', min_doc_count=0)

    logger.debug("query = %s", json.dumps(search.to_dict()))
    result = search.execute()
    logger.debug("result = %s",
                 json.dumps(result.aggregations['by_host']['buckets']))

    return [_format_log_count(b)
            for b
            in result.aggregations['by_host']['buckets']]
