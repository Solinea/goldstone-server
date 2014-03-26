from django.conf import settings
from elasticsearch import Elasticsearch

__author__ = 'stanford'


class GSConnection(object):
    conn = None

    def __init__(self, server=settings.ES_SERVER):
        self.conn = Elasticsearch(server)


class ESData(object):

    _conn = GSConnection().conn

    #
    # query construction helpers
    #
    @staticmethod
    def _query_base(self):
        return {
            "query": {}
        }

    @staticmethod
    def _filtered_query_base(self):
        return {
            "query": {
                "filtered": {
                    "query": {},
                    "filter": {}
                }
            }
        }

    @staticmethod
    def _add_facet(self, q, facet):
            result = q.copy()
            if not 'facets' in result:
                result['facets'] = {}

            result['facets'][facet.keys()[0]] = facet[facet.keys()[0]]
            return result

    @staticmethod
    def _query_term(self, field, value):
        return {
            "term": {
                field: value
            }
        }

    def _query_range(self, field, start, end, gte=True, lte=True, facet=None):
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
                result = self._add_facet(result, facet)

            return result

    @staticmethod
    def _agg_date_hist(self, interval, field="@timestamp",
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
    def _agg_filter_term(self, field, value, name):
        return {
            name: {
                "filter": {
                    "term": {
                        field: value
                    }
                }
            }
        }
