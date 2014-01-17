# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
from __future__ import unicode_literals
import calendar
from django.http import HttpResponse
from django.conf import settings

from django.views.generic import TemplateView
from django.template import RequestContext
from django.shortcuts import render_to_response
import math
from .models import LogData
from datetime import datetime, timedelta, time
import pytz
import json

# import the logging library
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)


class IntelSearchView(TemplateView):

    template_name = 'search.html'

    def get_context_data(self, **kwargs):

        context = super(IntelSearchView, self).get_context_data(**kwargs)
        end_time = self.request.GET.get('end_time', None)
        start_time = self.request.GET.get('start_time', None)
        context['interval'] = self.request.GET.get('interval', 'month')

        end_dt = datetime.fromtimestamp(int(end_time),
                                        tz=pytz.utc) \
            if end_time else datetime.now(tz=pytz.utc)

        start_dt = datetime.\
            fromtimestamp(int(start_time), tz=pytz.utc) \
            if start_time else end_dt - timedelta(weeks=4)

        context['end_ts'] = calendar.timegm(end_dt.utctimetuple())
        context['start_ts'] = calendar.timegm(start_dt.utctimetuple())
        return context


class IntelErrorsView(TemplateView):
    template_name = 'errors.html'


class IntelLogCockpitView(TemplateView):
    template_name = 'log-cockpit.html'


class IntelLogCockpitStackedView(TemplateView):
    template_name = 'log-cockpit-stacked-bar.html'


def log_cockpit_summary(request):

    end_time = request.GET.get('end_time')
    start_time = request.GET.get('start_time')
    interval = request.GET.get('interval', 'day')

    end_dt = datetime.fromtimestamp(int(end_time),
                                    tz=pytz.utc) \
        if end_time else datetime.now(tz=pytz.utc)
    start_dt = datetime.\
        fromtimestamp(int(start_time), tz=pytz.utc) \
        if start_time else end_dt - timedelta(weeks=4)

    conn = LogData.get_connection(settings.ES_SERVER, settings.ES_TIMEOUT)

    raw_data = LogData.get_err_and_warn_hists(conn, start_dt, end_dt, interval)

    errs_list = raw_data['err_facet']['entries']
    warns_list = raw_data['warn_facet']['entries']
    for err in errs_list:
        err['loglevel'] = 'error'
    for warn in warns_list:
        warn['loglevel'] = 'warning'

    cooked_data = sorted(errs_list + warns_list,
                         key=lambda event: event['time'])

    first_ts = cooked_data[0]['time']
    last_ts = cooked_data[len(cooked_data)-1]['time']

    if first_ts > (int(start_time)*1000):
        cooked_data.insert(
            0,
            {'time': int(start_time)*1000, 'count': 0, 'loglevel': 'warning'})

    if last_ts < (int(end_time)*1000):
        cooked_data.append(
            {'time': int(end_time)*1000, 'count': 0, 'loglevel': 'warning'})

    data = {'data': cooked_data}

    return HttpResponse(json.dumps(data), content_type="application/json")


def log_search_data(request, start_time, end_time):

    conn = LogData.get_connection(settings.ES_SERVER, settings.ES_TIMEOUT)

    keylist = ['@timestamp', 'loglevel', 'component', 'host', 'message',
               'path', 'pid', 'program', 'separator', 'type', 'received_at']

    keymap = {'timestamp': '@timestamp',
              'loglevel': 'loglevel',
              'component': 'component',
              'host': 'host',
              'message': 'message',
              'location': 'path',
              'pid': 'pid',
              'source': 'program',
              'request_id': 'separator',
              'type': 'type',
              'received': 'received_at'}

    start_ts = int(start_time)
    end_ts = int(end_time)
    sort_index = int(request.GET.get('iSortCol_0'))
    sort_col = keylist[sort_index] if sort_index else keylist[0]
    sort_dir_in = request.GET.get('sSortDir_0')
    sort_dir = sort_dir_in if sort_dir_in else "asc"
    print("sort_col = ", sort_col)
    print("sort_dir = ", sort_dir)

    rs = LogData.get_err_and_warn_range(
        conn,
        datetime.fromtimestamp(start_ts, tz=pytz.utc),
        datetime.fromtimestamp(end_ts, tz=pytz.utc),
        int(request.GET.get('iDisplayStart')),
        int(request.GET.get('iDisplayLength')),
        global_filter_text=request.GET.get('sSearch', None),
        sort={sort_col: {'order': sort_dir}})

    response = {
        "sEcho": int(request.GET.get('sEcho')),
        "iTotalRecords": rs.total,
        "iTotalDisplayRecords": len(rs),
        "aaData": [[kv['@timestamp'],
                    kv['loglevel'],
                    kv['component'],
                    kv['host'],
                    kv['message'],
                    kv['path'],
                    kv['pid'],
                    kv['program'],
                    kv['separator'],
                    kv['type'],
                    kv['received_at']] for kv in rs]
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")
