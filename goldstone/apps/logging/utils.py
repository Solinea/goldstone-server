"""Logging utilities"""
# Copyright '2015' Solinea, Inc.
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
from arrow import Arrow
from elasticsearch_dsl import Search, query
from goldstone.models import es_indices, es_conn
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _format_log_count(bucket):
    """Helper takes an aggregation bucket and returns a friendlier dict."""
    return {bucket['key']: dict(
        (level['key'], level['doc_count'])
        for level in bucket['by_level']['buckets']
    )}


def _ranged_log_search(start, end, hosts, index_prefix='logstash-'):
    """ Returns a search with time range and hosts list terms."""

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

    return search.sort({"@timestamp": {"order": "desc"}}).using(es_conn())


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

    search = _ranged_log_search(start, end, hosts, index_prefix)

    search.aggs.bucket('by_host', 'terms', field='host.raw'). \
        metric('by_level', 'terms', field='loglevel', min_doc_count=0)

    logger.debug("query = %s", json.dumps(search.to_dict()))
    response = search.execute()
    logger.debug("result = %s",
                 json.dumps(response.aggregations['by_host']['buckets']))

    return [_format_log_count(b)
            for b
            in response.aggregations['by_host']['buckets']]


def logged_error_events(
        start=None,
        end=None,
        hosts=[],
        page=1,
        page_size=settings.REST_FRAMEWORK['PAGINATE_BY'],
        index_prefix='logstash-'):
    """Retrieve log messages with ERROR, ALERT, EMERGENCY, or CRITICAL.

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

    first = (page - 1) * page_size

    search = _ranged_log_search(start, end, hosts, index_prefix)
    search = search.query(
        query.Terms(loglevel=['emergency', 'error', 'alert', 'critical']))
    search = search[first:page_size]
    logger.info("query = %s", json.dumps(search.to_dict()))
    response = search.execute()
    logger.info("result = %s", response.hits)

    ###
    ### leaving off here for the day.  things left to resolve include
    ### the ability to paginate log event data.  Would be nice to use
    ### the DocType interface so we can write a general serializer for
    ### that type of thing.
    ###
    return response