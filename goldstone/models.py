# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

from django.conf import settings
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ElasticsearchException
import redis
from datetime import datetime
from types import StringType
import json
import logging
import pandas as pd
from goldstone.apps.core.tasks import _create_daily_index
from goldstone.utils import NoDailyIndex

logger = logging.getLogger(__name__)


class GSConnection(object):
    conn = None

    def __init__(self, server=settings.ES_SERVER):
        self.conn = Elasticsearch(server)


class RedisConnection(object):
    conn = None

    def __init__(self,
                 host=settings.REDIS_HOST,
                 port=settings.REDIS_PORT,
                 db=settings.REDIS_DB):

        self.conn = redis.StrictRedis(host=host, port=port, db=db)


class ESData(object):

    _conn = GSConnection().conn

    def _get_latest_index(self, prefix):
        """
        Get an index based on a prefix filter and simple list sort.  assumes
         that sorting the list of indexes with matching prefix will
         result in the most current one at the end of the list.  Works for
         typical datestamp index names like logstash-2014.03.27.  If you know
         your index names have homogeneous, should work without the prefix, but
         use caution!

        :arg prefix: the prefix used to filter index list
        :returns: index name
        """

        candidates = []
        if prefix is not None:
            candidates = [k for k in
                          self._conn.indices.status()['indices'].keys() if
                          k.startswith(prefix + "-")]
        else:
            candidates = [k for k in
                          self._conn.indices.status()['indices'].keys()]
        candidates.sort()
        try:
            return candidates.pop()
        except IndexError:
            # if we can't find a goldstone index, let's just create one
            if prefix == 'goldstone':
                _create_daily_index()
                candidates = [k for k in
                              self._conn.indices.status()['indices'].keys() if
                              k.startswith(prefix + "-")]
                candidates.sort()
                try:
                    return candidates.pop()
                except IndexError:
                    raise NoDailyIndex("No daily indices with prefix " +
                                       prefix + " found.")

    #
    # query construction helpers
    #
    @staticmethod
    def _query_base():
        return {
            "query": {}
        }

    @staticmethod
    def _filtered_query_base(query={}, filter={}):
        return {
            "query": {
                "filtered": {
                    "query": query,
                    "filter": filter
                }
            }
        }

    @staticmethod
    def _add_facet(q, facet):
            result = q.copy()
            if 'facets' not in result:
                result['facets'] = {}

            result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
            return result

    @staticmethod
    def _term_clause(field, value):
        return {
            "term": {
                field: value
            }
        }

    @staticmethod
    def _terms_clause(field):
        return {
            "terms": {
                "field": field
            }
        }

    @staticmethod
    def _bool_clause(must=[], must_not=[]):
        return {
            "bool": {
                "must": must,
                "must_not": must_not
            }
        }

    @staticmethod
    def _range_clause(field, start, end, gte=True, lte=True, facet=None):
            start_op = "gte" if gte else "gt"
            end_op = "lte" if lte else "lt"
            result = {
                "range": {
                    field: {
                        start_op: start,
                        end_op: end
                    }
                }
            }

            if facet:
                result = ESData._add_facet(result, facet)

            return result

    @staticmethod
    def _agg_date_hist(interval, field="@timestamp",
                       name="events_by_date",
                       min_doc_count=0):
        return {
            name: {
                "date_histogram": {
                    "field": field,
                    "interval": interval,
                    "min_doc_count": min_doc_count
                }
            }
        }

    @staticmethod
    def _agg_filter_term(field, value, name):
        return {
            name: {
                "filter": {
                    "term": {
                        field: value
                    }
                }
            }
        }

    @staticmethod
    def _max_aggs_clause(name, field):
        return {
            name: {
                "max": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _avg_aggs_clause(name, field):
        return {
            name: {
                "avg": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _min_aggs_clause(name, field):
        return {
            name: {
                "min": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _stats_aggs_clause(name, field):
        return {
            name: {
                "stats": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _ext_stats_aggs_clause(name, field):
        return {
            name: {
                "extended_stats": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _http_response_aggs_clause(name, field):
        return {
            name: {
                "range": {
                    "field": field,
                    "keyed": True,
                    "ranges": [
                        {"from": 200, "to": 299},
                        {"from": 300, "to": 399},
                        {"from": 400, "to": 499},
                        {"from": 500, "to": 599}
                    ]
                }
            }
        }

    @staticmethod
    def _percentiles_aggs_clause(name, field):
        return {
            name: {
                "percentiles": {
                    "field": field
                }
            }
        }

    @staticmethod
    def _agg_clause(name, clause):
        return {
            name: clause
        }

    def post(self, body, **kwargs):
        """
        posts a record to the database.
        :arg body: record body as JSON object
        :arg **kwargs: named parameters to be passed to ES create
        :return id of the inserted record
        """
        logger.debug("post called with body = %s", json.dumps(body))
        response = self._conn.create(
            ESData._get_latest_index(self, self._INDEX_PREFIX),
            self._DOC_TYPE, body, refresh=True)
        logger.debug('[post] response = %s', json.dumps(response))
        return response['_id']

    def delete(self, doc_id):
        """
        deletes a record from the database by id.
        :arg doc_id: the id of the doc as returned by post
        :return bool
        """
        q = ESData._query_base()
        q['query'] = ESData._term_clause("_id", doc_id)
        response = self._conn.delete_by_query("_all", self._DOC_TYPE, body=q)
        logger.debug("[delete] response = %s", json.dumps(response))

        # need to test for a single index case where there is no "all" field
        if 'all' in response['_indices']:
            return not bool(response['_indices']['all']['_shards']['failed'])
        else:
            return not bool(response['_indices'].
                            values()[0]['_shards']['failed'])


class ApiPerfData(ESData):
    _DOC_TYPE = 'openstack_api_stats'
    _INDEX_PREFIX = 'goldstone'
    # override component for implementation
    component = None

    def _api_perf_query(self, start, end, interval):
        """
        Sets up a query that does aggregations on the response_time field min,
        max, avg for the bucket.
        """
        range_filter = self._range_clause('@timestamp', start.isoformat(),
                                          end.isoformat())
        filter_list = [range_filter]
        if self.component:
            component_filter = self._term_clause('component', self.component)
            filter_list.append(component_filter)

        q = self._filtered_query_base(self._bool_clause(
            filter_list), {'match_all': {}})
        date_agg = self._agg_date_hist(interval)
        stats_agg = self._ext_stats_aggs_clause("stats", "response_time")
        http_response_agg = self._http_response_aggs_clause("range",
                                                            "response_status")
        date_agg['events_by_date']['aggs'] = dict(stats_agg.items() +
                                                  http_response_agg.items())
        q['aggs'] = date_agg
        logger.debug('[_api_perf_query] query = ' + json.dumps(q))
        return q

    def get(self, start, end, interval):
        """
        :arg start: datetime used to filter the query range
        :arg end: datetime used to filter the query range
        :arg interval: string representation of the time interval to use when
        aggregating the results.  Form should be something like: '1.5s'.
        Supported time postfixes are s, m, h, d, w, m.
        """
        assert type(start) is datetime, "start is not a datetime: %r" % \
                                        type(start)
        assert type(end) is datetime, "end is not a datetime: %r" % type(end)
        assert type(interval) in [StringType, unicode], \
            "interval is not a string: %r" % type(interval)
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval

        q = self._api_perf_query(start, end, interval)
        logger.debug('[get] query = %s', json.dumps(q))
        r = self._conn.search(index="_all", body=q,
                              doc_type=self._DOC_TYPE)
        logger.debug('[get] search response = %s', json.dumps(r))
        items = []
        for date_bucket in r['aggregations']['events_by_date']['buckets']:
            logger.debug("[get] processing date_bucket: %s",
                         json.dumps(date_bucket))
            item = {'key': date_bucket['key']}
            item = dict(item.items() + date_bucket['stats'].items())
            item['2xx'] = \
                date_bucket['range']['buckets']['200.0-299.0']['doc_count']
            item['3xx'] = \
                date_bucket['range']['buckets']['300.0-399.0']['doc_count']
            item['4xx'] = \
                date_bucket['range']['buckets']['400.0-499.0']['doc_count']
            item['5xx'] = \
                date_bucket['range']['buckets']['500.0-599.0']['doc_count']

            items.append(item)

        logger.debug('[get] items = %s', json.dumps(items))
        result = pd.read_json(json.dumps(items), orient='records',
                              convert_axes=False)
        logger.debug('[get] pd = %s', result)
        return result

    def post(self, body):
        """
        posts an ApiPerf record to the database.
        :arg body: record body as JSON object
        :return id of the inserted record
        """
        logger.debug("post called with body = %s", json.dumps(body))
        response = self._conn.create(
            ESData._get_latest_index(self, self._INDEX_PREFIX),
            self._DOC_TYPE, body, refresh=True)
        logger.debug('[post] response = %s', json.dumps(response))
        return response['_id']

    def delete(self, doc_id):
        """
        deletes an ApiPerf Zone record from the database by id.
        :arg doc_id: the id of the doc as returned by post
        :return bool
        """
        q = ESData._query_base()
        q['query'] = ESData._term_clause("_id", doc_id)
        response = self._conn.delete_by_query("_all", self._DOC_TYPE,
                                              body=q)
        logger.debug("[delete] response = %s", json.dumps(response))

        # need to test for a single index case where there is no "all" field
        if 'all' in response['_indices']:
            return not bool(response['_indices']['all']['_shards']['failed'])
        else:
            return not bool(response['_indices'].
                            values()[0]['_shards']['failed'])


class TopologyData(ESData):

    def get(self, count=1, sort_key="@timestamp"):
        """
        returns the latest n
        """
        sort_str = sort_key + ":desc"
        try:
            logger.debug('[get] {"query details":  {"index": "_all", "query": '
                         '{"query": {"match_all": {}}}, "doc_type": %s, '
                         '"size": %d, "sort": %s"', self._DOC_TYPE, count,
                         sort_str)
            r = self._conn.search(index="_all",
                                  body='{"query": {"match_all": {}}}',
                                  doc_type=self._DOC_TYPE, size=count,
                                  sort=sort_str)
            logger.debug('[get] search response = %s', json.dumps(r))
            return r['hits']['hits']
        except ElasticsearchException as e:
            logger.debug("get from ES failed, exception was %s", e.message)
            return None
