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
from django.conf import settings
from elasticsearch_dsl import Search
from elasticsearch_dsl.connections import connections
import redis

import json
import logging

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


def most_recent_index(prefix=""):
    """Find the index matching the prefix that has the most recent datestamp.

    :param prefix: index prefix
    :return: the last index of a sorted list
    """

    all_indices = es_indices(prefix)
    all_indices.sort()
    return all_indices[-1]


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


def _create_or_replace_alias(index_name, server=settings.ES_SERVER,
                             alias='goldstone'):
    """Manage an alias for an index.

    Takes an index name and an alias name.  If the alias does not exist,
    it is created and associated with the provided index name.  If the
    alias already exists, it is repointed at the provided index.
    """
    try:
        conn = es_conn(server)
        if conn.indices.exists_alias(alias):
            conn.indices.update_aliases({
                "actions": [
                    {"remove": {"index": "_all", "alias": alias}},
                    {"add": {"index": index_name, "alias": alias}}
                ]
            })
        else:
            conn.indices.put_alias(alias, index_name)
    except Exception:         # pylint: disable=W0703
        logger.warn('Alias creation failed. Please report this.')
        raise


def create_daily_index(basename):
    """Create a new Elasticsearch index and set up the goldstone alias."""
    from datetime import date
    from elasticsearch.exceptions import RequestError

    now = date.today()
    index_name = basename + "-" + now.strftime("%Y.%m.%d")

    try:
        conn = es_conn(settings.ES_SERVER)
        conn.indices.create(index_name, body=None)

        _create_or_replace_alias(index_name)

    except RequestError as exc:
        # Reraise anything that isn't index already exists
        if not exc.error.startswith('IndexAlreadyExistsException'):
            logger.warn('Index creation failed. Please report this error.')
            raise
        else:
            logger.debug('Attempt to create index %s failed. Already exists.',
                         index_name)

    except Exception:         # pylint: disable=W0703
        logger.exception("Failed to create the daily goldstone index and/or"
                         "alias.  Please report this.")
        raise


class ESData(object):

    _conn = es_conn()

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
        """Return an index based on a prefix filter and simple list sort.

        This assumes sorting the list of indexes with matching prefix will
        result in the most current one at the end of the list.  Works for
        typical datestamp index names like logstash-2014.03.27.  If you know
        your index names have homogeneous, should work without the prefix, but
        use caution!

        :arg prefix: the prefix used to filter index list
        :returns: index name

        """
        from goldstone.utils import NoDailyIndex

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
                create_daily_index("goldstone")
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


class TopologyData(object):

    _DOC_TYPE = ""
    _INDEX_PREFIX = ""

    def __init__(self):
        self.conn = es_conn()
        self.search = Search(self.conn)

        # Using the private setters over methods simplifies mocking for
        # unit tests.
        # pylint: disable=W0212
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
        """Return the latest n instances from ES or None if not found."""
        from elasticsearch import ElasticsearchException

        try:
            self.search.sort(self._sort_arg(sort_key, sort_order))
            # only interested in one record
            self.search = self.search[0:1]
            logger.debug("[get] search = %s", self.search.to_dict())
            # pylint: disable=W0212
            logger.debug("[get] index = %s", self.search._index)
            logger.debug("[get] doc_type = %s", self._DOC_TYPE)

            return self.search.execute()

        except ElasticsearchException as exc:
            logger.debug("get from ES failed, exception was %s", exc.message)
            raise

        except ValueError as exc:
            logger.exception(exc)
            raise

    def post(self, body, **_):
        """Post a record to the database.

        :arg body: record body as JSON object
        :arg _: Unused.
        :return: id of the inserted record

        """

        logger.debug("post called with body = %s", json.dumps(body))

        response = self.conn.create(
            daily_index(self._INDEX_PREFIX),
            self._DOC_TYPE,
            body,
            refresh=True)

        logger.debug('[post] response = %s', json.dumps(response))
        return response['_id']
