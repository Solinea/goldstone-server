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
import math

logger = logging.getLogger(__name__)


class IntelSearchView(TemplateView):
    template_name = 'search.html'

    def get_context_data(self, **kwargs):

        context = super(IntelSearchView, self).get_context_data(**kwargs)
        end_time = self.request.GET.get('end_time', None)
        start_time = self.request.GET.get('start_time', None)

        end_dt = datetime.fromtimestamp(int(end_time),
                                        tz=pytz.utc) \
            if end_time else datetime.now(tz=pytz.utc)

        start_dt = datetime.\
            fromtimestamp(int(start_time), tz=pytz.utc) \
            if start_time else end_dt - timedelta(weeks=1)

        context['end_ts'] = calendar.timegm(end_dt.utctimetuple())
        context['start_ts'] = calendar.timegm(start_dt.utctimetuple())
        return context


def log_event_histogram(request):
    end_time = request.GET.get('end_time')
    start_time = request.GET.get('start_time')
    interval = request.GET.get('interval', '1h')
    logger.debug("[bad_event_histogram] interval = %s", interval)
    logger.debug("[bad_event_histogram] start_time = %s", start_time)
    logger.debug("[bad_event_histogram] end_time = %s", end_time)

    end_dt = datetime.fromtimestamp(int(end_time),
                                    tz=pytz.utc) \
        if end_time else datetime.now(tz=pytz.utc)

    start_dt = datetime.\
        fromtimestamp(int(start_time), tz=pytz.utc) \
        if start_time else end_dt - timedelta(weeks=1)

    conn = LogData.get_connection(settings.ES_SERVER)

    ld = LogData()
    logger.debug("[log_event_histogram] interval = %s", interval)
    raw_data = ld.get_loglevel_histogram_data(conn, start_dt, end_dt, interval)

    result = []
    for time_bucket in raw_data['events_by_time']['buckets']:
        entry = {}
        for level_bucket in time_bucket['events_by_loglevel']['buckets']:
            vals = level_bucket.values()
            lev = vals[0]
            entry[lev] = vals[1]

        entry['time'] = time_bucket['key']
        result.append(entry)

    data = {'data': result,
            'levels': ['error', 'warning', 'audit', 'info', 'debug']}
    logger.debug("[log_event_histogram]: data = %s", json.dumps(data))
    return HttpResponse(json.dumps(data), content_type="application/json")


def log_search_data(request):

    conn = LogData.get_connection(settings.ES_SERVER)

    keylist = ['@timestamp', 'loglevel', 'component', 'host', 'message',
               'path', 'pid', 'program', 'request_id_list', 'type',
               'received_at']

    logger.debug("[log_search_data] end_time = %s",
                 request.GET.get('end_time'))

    end_ts = int(request.GET.get('end_time'))
    start_ts = int(request.GET.get('start_time'))
    level_filters = {
        'error': request.GET.get('error', True),
        'warning': request.GET.get('warning', True),
        'info': request.GET.get('info', True),
        'audit': request.GET.get('audit', True),
        'debug': request.GET.get('debug', True)
    }
    for k in level_filters.keys():
        if level_filters[k].__class__.__name__ != 'bool':
            if level_filters[k].lower() == 'false':
                level_filters[k] = False
            else:
                level_filters[k] = True

    sort_index = int(request.GET.get('iSortCol_0'))
    sort_col = keylist[sort_index] if sort_index else keylist[0]
    sort_dir_in = request.GET.get('sSortDir_0')
    sort_dir = sort_dir_in if sort_dir_in else "desc"

    ld = LogData()
    rs = ld.get_log_data(
        conn,
        datetime.fromtimestamp(start_ts, tz=pytz.utc),
        datetime.fromtimestamp(end_ts, tz=pytz.utc),
        int(request.GET.get('iDisplayStart')),
        int(request.GET.get('iDisplayLength')),
        level_filters,
        search_text=request.GET.get('sSearch', None),
        sort=["".join([sort_col, ":", sort_dir])],
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
    options = {'month': timedelta(weeks=4), 'week': timedelta(weeks=1),
               'day': timedelta(days=1), 'hour': timedelta(hours=1),
               'minute': timedelta(minutes=1)}
    return end - options[interval]


@waffle_switch('gse')
def compute_vcpu_stats(request):

    interval = request.GET.get('interval', '1h')
    end_time = request.GET.get('end_time',
                               calendar.timegm(
                                   datetime.now(tz=pytz.utc).utctimetuple()))
    end_dt = datetime.fromtimestamp(int(end_time), tz=pytz.utc)
    start_time = request.GET.get('start_time',
                                 calendar.timegm(
                                     _calc_start('week', end_dt).
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

    return HttpResponse(json.dumps(response), content_type="application/json")


def _calc_host_presence_time(reftime, qty, unit):

    result = {
        'minutes': reftime - timedelta(minutes=qty),
        'hours': reftime - timedelta(hours=qty),
        'days': reftime - timedelta(days=qty),
        'weeks': reftime - timedelta(weeks=qty)
    }

    return result[unit.lower()]


def _host_presence_stats(domain_start_dt, inspect_start_dt, domain_end_dt):

    conn = LogData.get_connection(settings.ES_SERVER)

    #keylist = ['host', 'status']
    ld = LogData()
    response = ld.get_new_and_missing_nodes(conn, domain_start_dt,
                                            inspect_start_dt,
                                            domain_end_dt)

    aa_data = []
    for rec in response['missing_nodes']:
        aa_data.append([rec, 'MISSING'])
    for rec in response['new_nodes']:
        aa_data.append([rec, 'NEW'])

    # TODO remove this after basic testing of zones view
    aa_data.append(['compute-2', 'MISSING'])
    return aa_data


def host_presence_stats(request):

    valid_units = {
        'lookback': ['minutes', 'hours', 'days', 'weeks'],
        'comparison': ['minutes', 'hours', 'days']
    }

    domain_end = request.GET.get('domainEnd', calendar.timegm(
                                 datetime.now(tz=pytz.utc).utctimetuple()))
    domain_end_dt = datetime.fromtimestamp(int(domain_end), tz=pytz.utc)
    domain_start = int(request.GET.get('domainStart', calendar.timegm(
                                       _calc_start('week', domain_end_dt).
                                       utctimetuple())))
    domain_start_dt = datetime.fromtimestamp(int(domain_start), tz=pytz.utc)
    inspect_start = request.GET.get('inspectStart', calendar.timegm(
                                    _calc_start('hour', domain_end_dt).
                                    utctimetuple()))
    inspect_start_dt = datetime.fromtimestamp(int(inspect_start), tz=pytz.utc)

    logger.debug("[host_presence_stats], domain_start = %d", domain_start)
    logger.debug("[host_presence_stats], inspect_start = %s", inspect_start)
    logger.debug("[host_presence_stats], domain_end = %s", domain_end)

    aa_data = _host_presence_stats(domain_start_dt, inspect_start_dt,
                                   domain_end_dt)
    response = {
        "sEcho": int(request.GET.get('sEcho')),
        # This should be the result count without filtering, but no obvious
        # way to get that without doing the query twice.
        "iTotalRecords": len(aa_data),
        "iTotalDisplayRecords": len(aa_data),
        "aaData": aa_data
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")
