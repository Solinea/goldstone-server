"""Goldstone models."""
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
    """Return the index matching the prefix that has the most recent datestamp.

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
            self.search = self.search[0:count]
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
