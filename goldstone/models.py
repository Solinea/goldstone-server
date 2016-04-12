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
import json
import logging

from django.conf import settings
from elasticsearch_dsl import Search
from elasticsearch_dsl.connections import connections
import redis

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
    """Generate a daily index name of the form prefix-yyyy.mm.dd. When calling
    the index method of an ES connection, the target index will be created if
    it doesn't already exist. This only generates the name. It does not
    guarantee that the index exists.

    :type prefix: str
    :param prefix: the prefix used to filter index list
    :returns: index name

    """
    import arrow

    postfix = arrow.utcnow().format('YYYY.MM.DD')
    return prefix + postfix


class RedisConnection(object):
    """Return a connection to our redis server."""

    conn = None

    def __init__(self,
                 host=settings.REDIS_HOST,
                 port=settings.REDIS_PORT,
                 db=settings.REDIS_DB):

        self.conn = redis.StrictRedis(host=host, port=port, db=db)



