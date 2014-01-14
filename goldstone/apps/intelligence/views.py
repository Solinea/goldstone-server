# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
from __future__ import unicode_literals
from django.http import HttpResponse
from django.conf import settings

from django.views.generic import TemplateView
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import LogData
from datetime import datetime, timedelta
import pytz
import json

# import the logging library
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)


class IntelSearchView(TemplateView):
    template_name = 'search.html'


class IntelErrorsView(TemplateView):
    template_name = 'errors.html'


class IntelLogCockpitView(TemplateView):
    template_name = 'log-cockpit.html'


class IntelLogCockpitStackedView(TemplateView):
    template_name = 'log-cockpit-stacked-bar.html'


def log_cockpit_summary(request, interval='month'):

    conn = LogData.get_connection(settings.ES_SERVER, settings.ES_TIMEOUT)
    comps = LogData.get_components(conn)
    end = datetime.now(tz=pytz.utc)

    if interval == 'hour':
        start = end - timedelta(minutes=60)
    elif interval == 'day':
        start = end - timedelta(days=1)
    else:
        interval = 'month'
        start = end - timedelta(weeks=4)

    print("getting data: start=%s, end=%s, interval=%s"
          % (start, end, interval))
    raw_data = LogData.get_err_and_warn_hists(conn, start, end, interval)
    cooked_data = []
    print("raw_data = %s" % raw_data)
        # build up a flat list for d3
    errs_list = raw_data['err_facet']['entries']
    warns_list = raw_data['warn_facet']['entries']
    err_times = set([t['time'] for t in errs_list])
    warn_times = set([t['time'] for t in warns_list])
    intersect = err_times & warn_times

    for err in errs_list:
        err['errors'] = err['count']
        err['warnings'] = 0
        err.pop('count')

    for warn in warns_list:
        warn['warnings'] = warn['count']
        warn['errors'] = 0
        warn.pop('count')

    warns_list_no_intersect = [warn for warn in warns_list
                               if warn['time'] not in intersect]

    warns_list_intersect = [x for x in warns_list
                            if x not in warns_list_no_intersect]

    for warn in warns_list_intersect:
        err_index = next(index for (index, d) in enumerate(errs_list)
                         if d['time'] == warn['time'])
        errs_list[err_index]['warnings'] = warn['warnings']

    cooked_data += errs_list
    cooked_data += warns_list_no_intersect

    warnings =

    cooked_data = sorted(cooked_data, key=lambda event: event['time'])
    comps = LogData.get_components(conn)

    data = {'components': comps, 'data': cooked_data}

    return HttpResponse(json.dumps(data), content_type="application/json")


def log_search_data(request, start_time, end_time):

    conn = LogData.get_connection(settings.ES_SERVER, settings.ES_TIMEOUT)

    start_ts = int(start_time) / 1000
    end_ts = int(end_time) / 1000
    rs = LogData.get_err_and_warn_range(
        conn,
        datetime.fromtimestamp(start_ts, tz=pytz.utc),
        datetime.fromtimestamp(end_ts, tz=pytz.utc),
        int(request.GET.get('iDisplayStart')),
        int(request.GET.get('iDisplayLength')),
        sort={'@timestamp':{'order': 'desc'}})

    response = {
        "sEcho": int(request.GET.get('sEcho')),
        "iTotalRecords": rs.total,
        "iTotalDisplayRecords": rs.total,
        "aaData": [[kv['@timestamp'],
                    kv['loglevel'],
                    kv['component'],
                    kv['host'],
                    kv['message']] for kv in rs]
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")
