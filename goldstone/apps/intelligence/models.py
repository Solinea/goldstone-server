# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#


from django.db import models

from datetime import datetime, timedelta
from pyes import *
from pyes.facets import *
import pytz
import calendar


def _subtract_months(sourcedate, months):
    month = sourcedate.month - 1 - months
    year = sourcedate.year + month / 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day, sourcedate.hour,
                    sourcedate.minute, sourcedate.second,
                    sourcedate.microsecond, sourcedate.tzinfo)


def _calc_start(end, unit):
    if unit == "hour":
        t = end - timedelta(hours=1)
    elif unit == "day":
        t = end - timedelta(days=1)
    elif unit == "week":
        t = end - timedelta(weeks=1)
    else:
        t = _subtract_months(end, 1)
    return t.replace(tzinfo=pytz.utc)


def range_filter_facet(conn, start, end, filter_field, filter_value,
                       facet_field):

    q = RangeQuery(qrange=ESRange('@timestamp', start.isoformat(),
                                  end.isoformat())).search()
    filt = TermFilter(filter_field, filter_value)
    fac = TermFacet(field=facet_field, facet_filter=filt, all_terms=True,
                    order='term')
    q.facet.add(fac)
    rs = conn.search(q)
    return rs


def aggregate_facets(conn, start, end, filter_field, filter_list, facet_field):
    return dict(
        (filt,
         range_filter_facet(conn, start, end, filter_field, filt,
                            facet_field).facets)
        for filt in filter_list
    )
