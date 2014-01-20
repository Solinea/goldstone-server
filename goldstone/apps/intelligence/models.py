# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#


from django.db import models
from django.conf import settings

from datetime import datetime, timedelta
from pyes import *
from pyes.facets import TermFacet, DateHistogramFacet
import pytz
import calendar


def subtract_months(sourcedate, months):
    """Subtracts a specified number of months from a provided date

    >>> subtract_months(datetime(2013, 12, 1), 1)
    datetime.datetime(2013, 11, 1, 0, 0)
    >>> subtract_months(datetime(2013, 12, 1), 12)
    datetime.datetime(2012, 12, 1, 0, 0)
    >>> subtract_months(datetime(2013, 12, 1, 12, 12, 12), 12)
    datetime.datetime(2012, 12, 1, 12, 12, 12)
    """
    month = sourcedate.month - 1 - months
    year = sourcedate.year + month / 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day, sourcedate.hour,
                    sourcedate.minute, sourcedate.second,
                    sourcedate.microsecond, sourcedate.tzinfo)


def calc_start(end, unit):
    """Subtract a fixed unit (hour, day, week, month) from a provided date.
    Ugly side effect is that it converts everything to UTC.

    >>> calc_start(datetime(2013, 12, 10, 12, 0, 0), 'hour')
    datetime.datetime(2013, 12, 10, 11, 0, tzinfo=<UTC>)
    >>> calc_start(datetime(2013, 12, 10, 12, 0, 0), 'day')
    datetime.datetime(2013, 12, 9, 12, 0, tzinfo=<UTC>)
    >>> calc_start(datetime(2013, 12, 10, 12, 0, 0), 'week')
    datetime.datetime(2013, 12, 3, 12, 0, tzinfo=<UTC>)
    >>> calc_start(datetime(2013, 12, 10, 12, 0, 0), 'month')
    datetime.datetime(2013, 11, 10, 12, 0, tzinfo=<UTC>)
    """

    if unit == "hour":
        t = end - timedelta(hours=1)
    elif unit == "day":
        t = end - timedelta(days=1)
    elif unit == "week":
        t = end - timedelta(weeks=1)
    else:
        t = subtract_months(end, 1)
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


class LogData(object):

    @staticmethod
    def get_connection(server=None, timeout=None):
        return ES(server=server, timeout=timeout) \
            if server \
            else ES(timeout=timeout)

    @staticmethod
    def err_and_warn_hist(conn, start, end, interval,
                          query_filter=None):

        q = RangeQuery(qrange=ESRange('@timestamp', start.isoformat(),
                                      end.isoformat())).search()
        err_filt = TermFilter('loglevel', 'error')
        fat_filt = TermFilter('loglevel', 'fatal')
        bad_filt = ORFilter([err_filt, fat_filt])
        warn_filt = TermFilter('loglevel', 'warning')

        f1 = bad_filt if not query_filter \
            else ANDFilter([bad_filt, query_filter])

        f2 = warn_filt if not query_filter \
            else ANDFilter([warn_filt, query_filter])

        err_fac = DateHistogramFacet("err_facet", "@timestamp", interval,
                                     facet_filter=f1, order='term')
        warn_fac = DateHistogramFacet("warn_facet", "@timestamp", interval,
                                      facet_filter=f2, order='term')
        q.facet.add(err_fac)
        q.facet.add(warn_fac)
        rs = conn.search(q)
        return rs

    @staticmethod
    def get_components(conn):
        q = MatchAllQuery().search()
        fac = TermFacet('component', all_terms=True)
        q.facet.add(fac)
        rs = conn.search(q)
        return [d['term'] for d in rs.facets['component']['terms']]

    @staticmethod
    def get_err_and_warn_hists(conn, start, end, interval=None):

        if interval == 'minute':
            search_interval = 'second'
        elif interval == 'hour':
            search_interval = 'minute'
        elif interval == 'day':
            search_interval = 'hour'
        elif interval == 'month':
            search_interval = 'day'
        else:
            search_interval = 'hour'

        result = LogData.err_and_warn_hist(conn, start, end,
                                           search_interval).facets

        return result

    @staticmethod
    def get_err_and_warn_range(conn, start_t, end_t, first, size, sort=None,
                               global_filter_text=None):

        q = RangeQuery(qrange=ESRange('@timestamp', start_t.isoformat(),
                       end_t.isoformat()))
        err_filt = TermFilter('loglevel', 'error')
        fat_filt = TermFilter('loglevel', 'fatal')
        bad_filt = ORFilter([err_filt, fat_filt])
        warn_filt = TermFilter('loglevel', 'warning')
        global_filt = TermFilter('_message', global_filter_text.lower()) if \
            global_filter_text else None

        f1 = bad_filt if not global_filt \
            else ANDFilter([bad_filt, global_filt])

        f2 = warn_filt if not global_filt \
            else ANDFilter([warn_filt, global_filt])

        f3 = ORFilter([f1, f2])

        fq = FilteredQuery(q, f3)

        rs = conn.search(Search(fq, start=first, size=size, sort=sort))

        return rs
