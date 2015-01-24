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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
import arrow
from django.conf import settings

import logging
from elasticsearch import ElasticsearchException
from pyes import BoolQuery, RangeQuery, ESRangeOp
from goldstone.models import ESData


__author__ = 'stanford'

logger = logging.getLogger(__name__)


class LoggingNodeStats(ESData):

    _stats = None

    def __init__(self, start_time=None, end_time=None):
        """
        Prime the statistics for all known nodes in the time range
        :param start_time: arrow time
        :param end_time: arrow time
        :return:
        """
        self.end_time = arrow.utcnow() if \
            end_time is None else end_time

        self.start_time = self.end_time.replace(
            minutes=(-1 * settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES)) \
            if start_time is None else start_time

        _query_value = BoolQuery(must=[
            RangeQuery(qrange=ESRangeOp(
                "@timestamp",
                "gte", self.start_time.isoformat(),
                "lte", self.end_time.isoformat())),
        ]).serialize()

        _aggs_value = {
            "by_host": {
                "terms": {
                    "field": "host.raw"
                },
                "aggregations": {
                    "by_level": {
                        "terms": {
                            "field": "loglevel",
                            "min_doc_count": 0
                        }
                    }
                }
            }
        }

        query = {
            "query": _query_value,
            "aggs": _aggs_value
        }

        logger.debug("query = %s", json.dumps(query))

        try:
            rs = self._conn.search(
                index=self.get_index_names('logstash-'), doc_type="syslog",
                body=query, size=0)

            self._stats = rs["aggregations"]["by_host"]["buckets"]

        except ElasticsearchException:
            logger.exception("error connecting to ES")
            raise

    def for_node(self, name):

        nodes = [x for x in self._stats if x['key'] == name]
        if len(nodes) > 0:
            return dict(
                (bucket['key'], bucket['doc_count'])
                for bucket in nodes[0]['by_level']['buckets']
            )
        else:
            return {}
