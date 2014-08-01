# Copyright '2014' Solinea, Inc.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from goldstone.models import ESData, GSConnection
from django.conf import settings
from datetime import datetime, timedelta
import pytz
import pyes
import logging

__author__ = 'stanford'

logger = logging.getLogger(__name__)

class LoggingNodeStats():
    _conn = GSConnection().conn
    node_name = None
    end_time = datetime.now(tz=pytz.utc)
    start_time = end_time - timedelta(
        minutes=settings.LOGGING_NODE_LOGSTATS_LOOKBACK_MINUTES)
    error = 0
    warning = 0
    info = 0
    audit = 0
    debug = 0

    def __init__(self, node_name):
        self.node_name = node_name
        _query_value = pyes.BoolQuery(must=[
            pyes.RangeQuery(qrange=pyes.ESRangeOp(
                "@timestamp",
                "gte", self.start_time.isoformat(),
                "lte", self.end_time.isoformat())),
            pyes.TermQuery("host.raw", node_name)
        ]).serialize()

        _aggs_value = {
            "events_by_level": {
                "terms": {
                    "field": "loglevel",
                    "min_doc_count": 0
                }
            }
        }

        query = {
            "query": _query_value,
            "aggs": _aggs_value
        }

        logger.debug("query = %s", json.dumps(query))

        rs = self._conn.search(
            index="_all", doc_type="syslog", body=query, size=0)

        buckets = rs["aggregations"]["events_by_level"]["buckets"]

        for bucket in buckets:
            if bucket['key'] == 'error':
                self.error = bucket['doc_count']
            elif bucket['key'] == 'warning':
                self.warning = bucket['doc_count']
            elif bucket['key'] == 'info':
                self.info = bucket['doc_count']
            elif bucket['key'] == 'audit':
                self.audit = bucket['doc_count']
            elif bucket['key'] == 'debug':
                self.debug = bucket['doc_count']

