# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
from __future__ import unicode_literals
import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.generic import TemplateView
from waffle.decorators import waffle_switch
from .models import LogData
from datetime import datetime, timedelta
import pytz
import json
import logging

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


def bad_event_histogram(request):

    end_time = request.GET.get('end_time')
    start_time = request.GET.get('start_time')
    interval = request.GET.get('interval', 'day')

    end_dt = datetime.fromtimestamp(int(end_time),
                                    tz=pytz.utc) \
        if end_time else datetime.now(tz=pytz.utc)

    start_dt = datetime.\
        fromtimestamp(int(start_time), tz=pytz.utc) \
        if start_time else end_dt - timedelta(weeks=4)

    conn = LogData.get_connection(settings.ES_SERVER)

    ld = LogData()
    raw_data = ld.get_loglevel_histogram_data(conn, start_dt, end_dt, interval)

    result = []
    for time_bucket in raw_data['events_by_time']['buckets']:
        entry = {}
        for level_bucket in time_bucket['events_by_loglevel']['buckets']:
            vals = level_bucket.values()
            lev = vals[0]
            ct = vals[1]
            if lev in ['fatal', 'error', 'warning']:
                entry[lev] = ct

        for lev in ['fatal', 'error', 'warning']:
            if lev not in entry.keys():
                entry[lev] = 0
        entry['time'] = time_bucket['key']
        result.append(entry)

    data = {'data': result}

    return HttpResponse(json.dumps(data), content_type="application/json")


def log_search_data(request, start_time, end_time):

    conn = LogData.get_connection(settings.ES_SERVER)

    keylist = ['@timestamp', 'loglevel', 'component', 'host', 'message',
               'path', 'pid', 'program', 'request_id_list', 'type',
               'received_at']

    start_ts = int(start_time)
    end_ts = int(end_time)
    sort_index = int(request.GET.get('iSortCol_0'))
    sort_col = keylist[sort_index] if sort_index else keylist[0]
    sort_dir_in = request.GET.get('sSortDir_0')
    sort_dir = sort_dir_in if sort_dir_in else "asc"

    ld = LogData()
    rs = ld.get_err_and_warn_range(
        conn,
        datetime.fromtimestamp(start_ts, tz=pytz.utc),
        datetime.fromtimestamp(end_ts, tz=pytz.utc),
        int(request.GET.get('iDisplayStart')),
        int(request.GET.get('iDisplayLength')),
        global_filter_text=request.GET.get('sSearch', None),
        sort=["".join([sort_col, ":", sort_dir])]
    )

    aa_data = []
    for rec in rs['hits']['hits']:
        kv = rec['_source']
        aa_data.append([kv['@timestamp'] if '@timestamp' in kv else "",
                       kv['loglevel'] if 'loglevel' in kv else "",
                       kv['component'] if 'component' in kv else "",
                       kv['host'] if 'host' in kv else "",
                       kv['message'] if 'message' in kv else "",
                       kv['path'] if 'path' in kv else "",
                       kv['pid'] if 'pid' in kv else "",
                       kv['program'] if 'program' in kv else "",
                       kv['request_id_list'] if
                       'request_id_list' in kv else "",
                       kv['type'] if 'type' in kv else "",
                       kv['received_at'] if 'received_at' in kv else ""])

    response = {
        "sEcho": int(request.GET.get('sEcho')),
        # This should be the result count without filtering, but no obvious
        # way to get that without doing the query twice.
        "iTotalRecords": rs['hits']['total'],
        "iTotalDisplayRecords": rs['hits']['total'],
        "aaData": aa_data
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")


def _calc_start(interval, end):
    options = {'day': timedelta(weeks=4), 'hour': timedelta(days=1),
               'minute': timedelta(hours=1), 'second': timedelta(minutes=1)}
    return end - options[interval]


@waffle_switch('gse')
def compute_vcpu_stats(request):

    interval = request.GET.get('interval', 'day')
    end_time = request.GET.get('end_time',
                               calendar.timegm(
                                   datetime.now(tz=pytz.utc).utctimetuple()))
    end_dt = datetime.fromtimestamp(int(end_time), tz=pytz.utc)
    start_time = request.GET.get('start_time',
                                 calendar.timegm(
                                     _calc_start('day', end_dt).
                                     utctimetuple()))

    start_dt = datetime.fromtimestamp(int(start_time), tz=pytz.utc)

    conn = LogData.get_connection(settings.ES_SERVER)

    ld = LogData()
    raw_data = ld.get_hypervisor_stats(conn, start_dt, end_dt, interval)
    logger.debug("raw_data = %s", json.dumps(raw_data))
    response = []
    for date_bucket in raw_data['aggregations']['events_by_date']['buckets']:
        item = {
            'time': date_bucket['key'],
            'total_configured_vcpus': 0,
            'avg_configured_vcpus': 0,
            'total_inuse_vcpus': 0,
            'avg_inuse_vcpus': 0
        }
        for host_bucket in date_bucket['events_by_host']['buckets']:
            item['total_configured_vcpus'] += \
                host_bucket['max_total_vcpus']['value']
            item['avg_configured_vcpus'] += \
                host_bucket['avg_total_vcpus']['value']
            item['total_inuse_vcpus'] += \
                host_bucket['max_active_vcpus']['value']
            item['avg_inuse_vcpus'] += \
                host_bucket['avg_active_vcpus']['value']

        response.append(item)

    return HttpResponse(json.dumps(response),
                        content_type="application/json")


def _calc_host_presence_time(reftime, qty, unit):

    result = {
        'minutes': reftime - timedelta(minutes=qty),
        'hours': reftime - timedelta(hours=qty),
        'days': reftime - timedelta(days=qty),
        'weeks': reftime - timedelta(weeks=qty)
    }

    return result[unit.lower()]


def host_presence_stats(request):

    valid_units = {
        'lookback': ['minutes', 'hours', 'days', 'weeks'],
        'comparison': ['minutes', 'hours', 'days']
    }

    lookback_qty = int(request.GET.get('lookbackQty', "60"))
    lookback_unit = request.GET.get('lookbackUnit', "minutes")
    comparison_qty = int(request.GET.get('comparisonQty', "5"))
    comparison_unit = request.GET.get('comparisonUnit', "minutes")

    logger.debug("[host_presence_stats], lookback_qty = %d", lookback_qty)
    logger.debug("[host_presence_stats], lookback_unit = %s", lookback_unit)
    logger.debug("[host_presence_stats], comparison_qty = %s", comparison_qty)
    logger.debug("[host_presence_stats], comparison_unit = %s",
                 comparison_unit)

    if not lookback_unit in valid_units['lookback']:
        return HttpResponseBadRequest(
            "Lookback unit must be one of "
            "['minutes', 'hours', 'days', 'weeks']")

    if not comparison_unit in valid_units['comparison']:
        return HttpResponseBadRequest(
            "Comparison unit must be one of "
            "['minutes', 'hours', 'days']")

    if lookback_qty <= 0 or comparison_qty <= 0:
        return HttpResponseBadRequest(
            "Lookback and comparison quantities must be > 0")

    end_time = request.GET.get('end_time',
                               calendar.timegm(
                                   datetime.now(tz=pytz.utc).utctimetuple()))
    end_dt = datetime.fromtimestamp(int(end_time), tz=pytz.utc)

    lookback_dt = _calc_host_presence_time(end_dt, lookback_qty,
                                           lookback_unit)
    comparison_dt = _calc_host_presence_time(end_dt, comparison_qty,
                                             comparison_unit)

    conn = LogData.get_connection(settings.ES_SERVER)

    keylist = ['host', 'status']
    ld = LogData()
    response = ld.get_new_and_missing_nodes(conn, lookback_dt, comparison_dt,
                                            end_dt)

    aa_data = []
    for rec in response['missing_nodes']:
        aa_data.append([rec, 'MISSING'])
    for rec in response['new_nodes']:
        aa_data.append([rec, 'NEW'])

    response = {
        "sEcho": int(request.GET.get('sEcho')),
        # This should be the result count without filtering, but no obvious
        # way to get that without doing the query twice.
        "iTotalRecords": len(response),
        "iTotalDisplayRecords": len(response),
        "aaData": aa_data
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")