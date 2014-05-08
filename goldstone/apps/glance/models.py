# Copyright 2014 Solinea, Inc.
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
from datetime import datetime, timedelta
import json
from django.conf import settings
from elasticsearch import ElasticsearchException
import pytz
import logging

__author__ = 'John Stanford'

from goldstone.models import ApiPerfData, TopologyData

logger = logging.getLogger(__name__)


class ApiPerfData(ApiPerfData):
    component = 'glance'


class ImageData(TopologyData):
    _DOC_TYPE = 'glance_image_list'
    _INDEX_PREFIX = 'goldstone'


class HostData(TopologyData):
    """
    This is a special where the host data is constructed from log information
    since it is not accessible via the API.
    """
    _DOC_TYPE = 'syslog'
    _INDEX_PREFIX = 'logstash'

    def get(self, count=1, sort_key="@timestamp"):
        """
        in this case, count is the number of time buckets where the bucket
        size is defined by the DEFAULT_PRESENCE_LOOKBACK_HOURS setting.  It
        will do a count rollup of the unique hosts logging with component of
        glance during the time window.
        """
        sort_str = sort_key + ":desc"
        interval = settings.DEFAULT_PRESENCE_LOOKBACK_HOURS
        lookback_hours = interval * count
        end = datetime.now(tz=pytz.utc)
        start = end - timedelta(hours=lookback_hours)
        interval_str = str(interval) + "h"

        q = {
            "query": {
                "filtered": {
                    "filter": {
                        "match_all": {}
                    },
                    "query": {
                        "bool": {
                            "must_not": [],
                            "must": [
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": start.isoformat(),
                                            "lte": end.isoformat()
                                        }
                                    }
                                },
                                {
                                    "term": {
                                        "component": "glance"
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            "aggs": {
                "events_by_date": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": interval_str,
                        "min_doc_count": 0
                    },
                    "aggs": {
                        "events_by_host": {
                            "terms": {
                                "field": "host.raw"
                            }
                        }
                    }
                }
            }
        }
        try:
            r = self._conn.search(index="_all",
                                  body=q,
                                  doc_type=self._DOC_TYPE, size=1,
                                  sort=sort_str)
            logger.debug('[get] search response = %s', json.dumps(r))
            # want to return just the hostnames, and @timestamp from the
            # aggregations.


            x = [{'@timestamp': y['key_as_string'], 'hosts': z}
                 for y in r['aggregations']['events_by_date']['buckets']
                 for z in [y['events_by_host']['buckets']]]
            resp = []
            for l in x:
                hosts = []
                for i in l['hosts']:
                    hosts.append(i['key'])
                resp.append({'@timestamp': l['@timestamp'], 'hosts': hosts})

            logger.debug('[get] response = %s', json.dumps(resp))
            return resp
        except ElasticsearchException as e:
            logger.warn("get from ES failed")
            logger.exception(e)
            return [[]]
