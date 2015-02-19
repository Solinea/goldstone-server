"""Goldstone models."""
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
from arrow import Arrow
from django.conf import settings
from elasticsearch import Elasticsearch, ElasticsearchException
from elasticsearch_dsl import Search, DocType, String, Date, Integer
from elasticsearch_dsl.connections import connections
import redis
from types import StringType
import json
import logging
import pandas as pd
from goldstone.apps.core.tasks import create_daily_index
from goldstone.utils import NoDailyIndex

logger = logging.getLogger(__name__)


def es_conn(server=settings.ES_SERVER):
    """Standardized connection to the ES cluster.

    :param server: a server definition of the form [host:port, ...].  See
    https://elasticsearch-py.readthedocs.org/en/master/api.html#elasticsearch
    for alternate host specification options.
    :return: an Elasticsearch connection instance
    """

    connections.configure(default=server,
                          max_retries=1,
                          sniff_on_start=False)
    return connections.get_connection()


def es_indices(prefix="", conn=None):
    """ es_indices gets a potentially filtered list of index names.

    :type prefix: str
    :param prefix: the prefix to filter for
    :type conn: Elasticsearch
    :param conn: an ES connection object
    :return: _all or list of index names

    """

    if prefix is not "":
        if conn is None:
            conn = es_conn()

        all_indices = conn.indices.status()['indices'].keys()
        return [i for i in all_indices if i.startswith(prefix)]
    else:
        return "_all"


def daily_index(prefix=""):
    """
    Generate a daily index name of the form prefix-yyyy.mm.dd.  When
    calling the index method of an ES connection, the target index will be
    created if it doesn't already exist. This only generates the name.  It
    does not guarantee that the index exists.

    :type prefix: str
    :param prefix: the prefix used to filter index list
    :returns: index name

    """

    import arrow
    postfix = arrow.utcnow().format('YYYY.MM.DD')
    return prefix + postfix


class RedisConnection(object):
    conn = None

    def __init__(self,
                 host=settings.REDIS_HOST,
                 port=settings.REDIS_PORT,
                 db=settings.REDIS_DB):

        self.conn = redis.StrictRedis(host=host, port=port, db=db)


class ESData(object):

    _conn = es_conn()

    def __init__(self):
        """Initialize the object, to keep pylint happy."""
        pass

    def get_index_names(self, prefix=None):
        """

        :type prefix: str
        :return:
        """
        all_indices = self._conn.indices.status()['indices'].keys()
        if prefix is not None:
            return [i for i in all_indices if i.startswith(prefix)]
        else:
            return all_indices

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
                create_daily_index()
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
        return {"query": {}}

    @staticmethod
    def _filtered_query_base(query=None, filterdict=None):

        return {
            "query": {
                "filtered": {
                    "query": query if query else {},
                    "filter": filterdict if filterdict else {}
                }
            }
        }

    @staticmethod
    def _add_facet(query, facet):
        result = query.copy()
        if 'facets' not in result:
            result['facets'] = {}

        result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
        return result

    @staticmethod
    def _term_clause(field, value):
        return {"term": {field: value}}

    @staticmethod
    def _terms_clause(field):
        return {"terms": {"field": field}}

    @staticmethod
    def _bool_clause(must=None, must_not=None):
        return {"bool": {"must": must if must else [],
                         "must_not": must_not if must_not else []}}

    @staticmethod
    def _range_clause(field, start, end, gte=True, lte=True, facet=None):
        start_op = "gte" if gte else "gt"
        end_op = "lte" if lte else "lt"
        result = {"range": {field: {start_op: start, end_op: end}}}

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
        return {name: clause}

    def post(self, body, **_):
        """Post a record to the database.

        :arg body: record body as JSON object
        :arg _: Unused.
        :return: id of the inserted record

        """

        logger.debug("post called with body = %s", json.dumps(body))

        response = self._conn.create(
            ESData._get_latest_index(self, self._INDEX_PREFIX),
            self._DOC_TYPE,
            body,
            refresh=True)

        logger.debug('[post] response = %s', json.dumps(response))
        return response['_id']

    def delete(self, doc_id):
        """Delete a database record by id.

        :arg doc_id: the id of the doc as returned by post
        :return bool

        """

        query = ESData._query_base()
        query['query'] = ESData._term_clause("_id", doc_id)
        response = self._conn.delete_by_query("_all",
                                              self._DOC_TYPE,
                                              body=query)
        logger.debug("[delete] response = %s", json.dumps(response))

        # need to test for a single index case where there is no "all" field
        if 'all' in response['_indices']:
            return not bool(response['_indices']['all']['_shards']['failed'])
        else:
            return not bool(response['_indices'].
                            values()[0]['_shards']['failed'])



class ApiPerfData(DocType):
    """API performance record model.

    response_status: int
    timestamp: date
    component: string
    uri: string
    response_length: int
    response_time int

    """

    # Field declarations.  They types are generated, so imports look broken
    # but hopefully are working...
    response_status = Integer()
    created = Date()
    component = String()
    uri = String()
    response_length = Integer()
    response_time = Integer()

    _INDEX_PREFIX = 'goldstone-'

    class Meta:
        doc_type = 'openstack_api_stats'


    @classmethod
    def _stats_search(cls, start, end, interval, component):
        """
        Sets up a query that does aggregations on the response_time field min,
        max, avg for the bucket.

        :type start: Arrow
        :param start:
        :type end: Arrow
        :param end:
        :type interval: str
        :param interval: number + unit (ex: 5s, 5m)
        :type component: str
        :param component:
        """

        search = cls.search().\
            filter('range', ** {'created': {
                'lte': end.isoformat(),
                'gte': start.isoformat()}})

        if component is not None:
            search = search.filter('term', component=component)

        search.aggs.bucket('events_by_date',
                           'date_histogram',
                           field='created',
                           interval=interval,
                           min_doc_count=0).\
            metric('stats', 'extended_stats', field='response_time').\
            bucket('range', 'range', field='response_status', keyed=True,
                   ranges=[
                        {"from": 200, "to": 299},
                        {"from": 300, "to": 399},
                        {"from": 400, "to": 499},
                        {"from": 500, "to": 599}
                    ])

        logger.debug("search = %s", search.to_dict())
        return search

    # TODO implement get_components

    @classmethod
    def get_stats(cls, start, end, interval, component=None):
        """Return a pandas object that contains API performance data.

        :type start: Arrow
        :param start: datetime used to filter the query range
        :type end: Arrow
        :param end: datetime used to filter the query range
        :type interval: str
        :param interval: string representation of the time interval to use when
                       aggregating the results.  Form should be something like
                       '1.5s'.  Supported time postfixes are s, m, h, d, w, m.
        :type component: str or None
        :param component: string, name of the api component
        :rtype: pd.DataFrame
        """

        assert type(start) is Arrow, "start is not an Arrow object"
        assert type(end) is Arrow, "end is not an Arrow object"
        assert type(interval) in [StringType, unicode], \
            "interval is not a string: %r" % type(interval)
        assert interval[-1] in ['s', 'm', 'h', 'd'], \
            "valid units for interval are ['s', 'm', 'h', 'd']: %r" \
            % interval

        search = cls._stats_search(start, end, interval, component)

        result = search.execute()
        logger.debug('[get] search result = %s', json.dumps(result.to_dict()))

        items = []

        for date_bucket in \
                result.aggregations['events_by_date']['buckets']:
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

        # items = json.dumps(items)

        # logger.debug('[get] items = %s', items)
        # result = pd.read_json(items, orient='records', convert_axes=False)
        # logger.debug('[get] pd = %s', result)

        return items

    def save(self, using=None, index=None, **kwargs):
        """Posts an ApiPerf record to the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = daily_index(self._INDEX_PREFIX)

        return super(ApiPerfData, self).save(using,
                                             index,
                                             **kwargs)

    @classmethod
    def get(cls, id, using=None, index=None, **kwargs):
        """Gets an ApiPerf record to the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(cls._INDEX_PREFIX)

        return super(ApiPerfData, cls).get(id,
                                           using=using,
                                           index=index,
                                           **kwargs)

    @classmethod
    def search(cls):
        """Gets an ApiPerf search object that can be used to .

        See elasticsearch-dsl for parameter information.
        """

        return Search(
            using=cls._doc_type.using,
            index=es_indices(cls._INDEX_PREFIX),
            doc_type={cls._doc_type.name: cls.from_es},
        )

    def delete(self, using=None, index=None, **kwargs):
        """Deletes an ApiPerf record from the database.

        See elasticsearch-dsl for parameter information.
        """

        if index is None:
            index = es_indices(self._INDEX_PREFIX)

        return super(ApiPerfData, self).delete(using=using,
                                               index=index,
                                               **kwargs)


class TopologyData(object):

    _DOC_TYPE = ""
    _INDEX_PREFIX = ""

    def __init__(self):
        self.conn = es_conn()
        self.search = Search(self.conn)

        # using the private setters over methods simplifies mocking for
        # unit tests.
        self.search._doc_type = self._DOC_TYPE
        self.search._index = es_indices(self._INDEX_PREFIX, self.conn)


    @classmethod
    def _sort_arg(cls, key, order):
        if order in ["+", "asc"]:
            return key              # translates to [{key: {'order': 'asc'}}]
        elif order in ["-", "desc"]:
            return "-" + key        # translates to [{key: {'order': 'desc'}}]
        else:
            raise ValueError("Valid order values are in [+, -, asc, desc]")

    def get(self, count=1, sort_key="@timestamp", sort_order="desc"):
        """
        returns the latest n instances from ES
        """

        try:
            self.search.sort(self._sort_arg(sort_key, sort_order))
            logger.debug("[get] search = %s", self.search.to_dict())
            logger.debug("[get] index = %s", self.search._index)
            logger.debug("[get] doc_type = %s", self._DOC_TYPE)

            result = self.search.execute()

            logger.debug('[get] search response = %s', result)
            return result['hits']['hits']

        except ElasticsearchException as exc:
            logger.debug("get from ES failed, exception was %s", exc.message)
            raise

        except ValueError as exc:
            logger.exception(exc)
            raise
