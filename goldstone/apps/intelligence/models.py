"""Intelligence models."""
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
from datetime import datetime, timedelta
import calendar
import json
import logging
import pytz
from goldstone.models import ESData

logger = logging.getLogger(__name__)


class LogData(ESData):

    @staticmethod
    def _subtract_months(sourcedate, months):
        month = sourcedate.month - 1 - months
        year = sourcedate.year + month / 12
        month = month % 12 + 1
        day = min(sourcedate.day, calendar.monthrange(year, month)[1])
        return datetime(year, month, day, sourcedate.hour,
                        sourcedate.minute, sourcedate.second,
                        sourcedate.microsecond, sourcedate.tzinfo)

    def _calc_start(self, end, unit):

        if unit == "hour":
            start = end - timedelta(hours=1)
        elif unit == "day":
            start = end - timedelta(days=1)
        elif unit == "week":
            start = end - timedelta(weeks=1)
        else:
            start = self._subtract_months(end, 1)

        return start.replace(tzinfo=pytz.utc)

    @staticmethod
    def _term_filter(field, value):

        return {"term": {field: value}}

    @staticmethod
    def _regexp_filter(field, value):

        return {"regexp": {field: value}}

    @staticmethod
    def _term_facet(name, field, facet_filter=None, all_terms=True,
                    order=None):

        result = {name: {"terms": {"field": field, "all_terms": all_terms}}}

        if order:
            result[name]['terms']['order'] = order

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    @staticmethod
    def _date_hist_facet(name, field, interval, facet_filter=None):

        result = \
            {name: {"date_histogram": {"field": field, "interval": interval}}}

        if facet_filter:
            result[name]['facet_filter'] = facet_filter

        return result

    def _get_term_facet_terms(self, facet_field):

        facet = self._term_facet(facet_field, facet_field, order='term')
        query = {'query': {'match_all': {}}, 'facets': {}}

        query['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
        logger.debug("[_get_term_facet_terms] query = %s", query)

        result = self._conn.search(index=self.get_index_names('logstash-'),
                                   body=query)

        return [d['term'] for d in result['facets'][facet_field]['terms']]

    def _loglevel_by_time_agg(self, start, end, interval, query_filter=None):

        logger.debug("[_loglevel_by_time_agg] ENTERING>>")
        logger.debug("[_loglevel_by_time_agg] interval = %s", interval)
        logger.debug("[_loglevel_by_time_agg] start = %s", start.isoformat())
        logger.debug("[_loglevel_by_time_agg] end = %s", end.isoformat())
        q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": start.isoformat(),
                                    "lte": end.isoformat()
                                }
                            }
                        },
                        {"terms": {"type": ["syslog"]}}
                    ]
                }
            },
            "aggs": {
                "events_by_time": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": interval,
                        "min_doc_count": 0
                    },
                    "aggs": {
                        "events_by_loglevel": {"terms": {"field": "loglevel"}}
                    }
                }
            }
        }

        logger.debug("[_loglevel_by_time_agg] query = %s", json.dumps(q))
        result = self._conn.search(index=self.get_index_names('logstash-'),
                                   body=q)

        logger.debug("[_loglevel_by_time_agg] result = %s", json.dumps(result))
        return result

    def get_components(self):
        return self._get_term_facet_terms("component")

    def get_loglevels(self):
        return self._get_term_facet_terms("loglevel")

    def get_loglevel_histogram_data(self, start, end, interval):

        result = self._loglevel_by_time_agg(start, end, interval)
        return result['aggregations']

    def _escape(self, str):
        """Escape lucene reserved characters in string."""

        s = list(str)
        RESERVED = ["+", "-" "!", "(", ")", "{", "}", "[", "]", '"',
                    "~", ":", "\\", "/"]

        for i, c in enumerate(str):
            if c in RESERVED:
                # TODO: Will this ever be true?
                s[i] = "\\000" if c == "\000" else "\\" + c

        return str[:0].join(s)

    def get_log_data(self, start_t, end_t, first, size,
                     level_filters=dict(), sort='', search_text=None):

        q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "@timestamp": {"gte": start_t.isoformat(),
                                               "lte": end_t.isoformat()
                                               }
                            }
                        }
                    ]
                }

            }
        }

        if search_text:
            escaped_search_text = self._escape(search_text)

            sq = {"query_string": {"default_operator": "AND",
                                   "query": escaped_search_text,
                                   "lenient": "true"
                                   }}
            q['query']['bool']['must'].append(sq)

        lev_filts = []

        for lev in [k for k in level_filters.keys() if level_filters[k]]:
            lev_filts.append(self._term_filter('loglevel', lev))

        if lev_filts:
            or_filt = {'or': lev_filts}
            q['filter'] = or_filt
            q = {'query': {'filtered': q}}

        logger.debug("[get_log_data] query = %s", json.dumps(q))
        return self._conn.search(index=self.get_index_names('logstash-'),
                                 body=q, from_=first, size=size, sort=sort)

    def get_hypervisor_stats(self, start, end, interval, first=0,
                             size=10, sort=''):

        q = {
            "query": {
                "bool": {
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
                                "type": "goldstone_nodeinfo"
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "events_by_date": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "interval": interval,
                        "min_doc_count": 0
                    },
                    "aggs": {
                        "events_by_host": {
                            "terms": {
                                "field": "host.raw"
                            },
                            "aggs": {
                                "max_total_vcpus": {
                                    "max": {"field": "total_vcpus"}
                                },
                                "avg_total_vcpus": {
                                    "avg": {"field": "total_vcpus"}
                                },
                                "max_active_vcpus": {
                                    "max": {"field": "active_vcpus"}
                                },
                                "avg_active_vcpus": {
                                    "avg": {"field": "active_vcpus"}
                                }
                            }
                        }
                    }
                }
            }
        }

        result = self._conn.search(index=self.get_index_names('logstash-'),
                                   body=q, from_=first, size=size, sort=sort)
        logger.debug('result = ' + json.dumps(result))

        return result
