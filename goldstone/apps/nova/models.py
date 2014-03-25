# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#


import logging
import json

import pandas as pd

from goldstone.models import ESData


logger = logging.getLogger(__name__)


class SpawnData(ESData):
    _START_DOC_TYPE = 'nova_spawn_start'
    _FINISH_DOC_TYPE = 'nova_spawn_finish'

    def __init__(self, start, end, interval):
        self.start = start
        self.end = end
        self.interval = interval

    def _spawn_start_query(self, agg_name="events_by_date"):
        q = ESData._query_base(self)
        q['query'] = ESData._query_range(self, '@timestamp',
                                         self.start.isoformat(),
                                         self.end.isoformat())
        q['aggs'] = ESData._agg_date_hist(self, self.interval, name=agg_name)
        return q

    def _spawn_finish_query(self, success):
        filter_name = "success_filter"
        agg_name = "events_by_date"
        q = ESData._query_base(self)
        q['query'] = ESData._query_range(self, '@timestamp',
                                         self.start.isoformat(),
                                         self.end.isoformat())
        q['aggs'] = ESData._agg_filter_term(self, "success",
                                            str(success).lower(),
                                            filter_name)
        q['aggs'][filter_name]['aggs'] = ESData._agg_date_hist(self,
                                                               self.interval,
                                                               name=agg_name)
        return q

    def get_spawn_start(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        start events"""
        agg_name = "events_by_date"
        q = self._spawn_start_query(agg_name)
        logger.debug("[get_spawn_start] query = %s", json.dumps(q))
        response = self._conn.search(index="_all",
                                     doc_type=self._START_DOC_TYPE,
                                     body=q, size=0)
        logger.debug("[get_spawn_start] response = %s", json.dumps(response))
        return pd.read_json(json.dumps(
            response['aggregations'][agg_name]['buckets'])
        )

    def _get_spawn_finish(self, success):
        fname = "success_filter"
        aname = "events_by_date"
        q = self._spawn_finish_query(success)
        logger.debug("[get_spawn_finish] query = %s", json.dumps(q))
        response = self._conn.search(index="_all",
                                     doc_type=self._FINISH_DOC_TYPE,
                                     body=q, size=0)
        logger.debug("[get_spawn_finish] response = %s", json.dumps(response))
        data = pd.read_json(json.dumps(
            response['aggregations'][fname][aname]['buckets']),
            orient='records')

        # this causes trouble with the merge later on.
        #if not data.empty:
        #    data.set_index('key', inplace=True)

        logger.debug("[get_spawn_finish] data = %s", data)
        return data

    def get_spawn_success(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        success events"""
        return self._get_spawn_finish(True)

    def get_spawn_failure(self):
        """Return a pandas dataframe with the results of a query for nova spawn
        failure events"""
        return self._get_spawn_finish(False)