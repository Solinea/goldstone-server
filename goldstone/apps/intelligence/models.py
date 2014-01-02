# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

import calendar
import pytz

from datetime import datetime, timedelta

from pyes import *
from pyes.facets import *

from django.db import models


# A non-managed, dummy model for admin purposes
class IgnoreMe(models.Model):
    class Meta:
        managed = False


COMPONENTS = ["ceilometer", "cinder", "glance", "nova", "neutron",
              "openvswitch", "apache", "heat", "keystone"]
TIME_PERIODS = ["hour", "day", "week", "month"]
LOG_LEVELS = ["fatal", "error", "warning", "info", "debug"]
# TODO push this to config
ES_SERVER = "10.10.11.121:9200"


def _subtract_months(sourcedate, months):
    month = sourcedate.month - 1 - months
    year = sourcedate.year + month / 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime.datetime(year, month, day, sourcedate.hour,
                             sourcedate.minute, sourcedate.second,
                             sourcedate.microsecond, sourcedate.tzinfo)


def _calc_start(self, end, unit):
    if unit == "hour":
        t = end - datetime.timedelta(hours=1)
    elif unit == "day":
        t = end - datetime.timedelta(days=1)
    elif unit == "week":
        t = end - datetime.timedelta(weeks=1)
    else:
        t = self._subtract_months(end, 1)
    return t.replace(tzinfo=pytz.utc)


def _build_query(self, unit, level, end):
    q = PrefixQuery('loglevel', str(level).lower()[:3])
    f = RangeFilter(
        qrange=ESRange('@timestamp', self._calc_start(end, unit), end))
    return FilteredQuery(q, f)


def _build_loglevel_query(self, end, unit):
    q = RangeQuery(
        qrange=ESRange('@timestamp', self._calc_start(end, unit), end)
    ).search()
    q.facet.add_term_facet("loglevel")
    return q


def _build_component_query(self, level, end, unit):
    rangeq = RangeQuery(
        qrange=ESRange('@timestamp', self._calc_start(end, unit).isoformat(),
                       end.isoformat()),
        ).search()
    level_filter = TermFilter('loglevel', level)
    comp_facet = TermFacet('component', facet_filter=level_filter)
    rangeq.facet.add(comp_facet)

    return rangeq


def get_log_summary_counts(self):
    conn = ES(self.ES_SERVER, timeout=5)
    end = datetime.datetime.now(pytz.utc)
    results = {
        p: conn.search(query=self._build_loglevel_query(end, p))
        for p in self.TIME_PERIODS
    }

    response = {}
    for rk, rv in results.iteritems():
        for k, v in rv.facets.iteritems():
            response[rk] = v['terms']

    return response


def get_component_summary_counts(self):
    conn = ES(self.ES_SERVER, timeout=5)
    end = datetime.datetime.now(pytz.utc)
    response = {}

    for period in self.TIME_PERIODS:
        level_counts = []

        for level in self.LOG_LEVELS:
            resultset = conn.search(
                query=self._build_component_query(level, end, period))
            level_counts.append(
                {level: resultset.facets['component']['terms']})
        response[period] = level_counts

    return response
