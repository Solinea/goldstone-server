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

        end_dt = datetime.fromtimestamp(int(end_time),
                                        tz=pytz.utc) \
            if end_time else datetime.now(tz=pytz.utc)

        start_dt = datetime.\
            fromtimestamp(int(start_time), tz=pytz.utc) \
            if start_time else end_dt - timedelta(weeks=1)

        context['end_ts'] = calendar.timegm(end_dt.utctimetuple())
        context['start_ts'] = calendar.timegm(start_dt.utctimetuple())
        return context


def bad_event_histogram(request):

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
    logger.debug("[bad_event_histogram] interval = %s", interval)
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

    # let's make sure we fill the complete graph by putting a record at the
    # front and back
    first_key = int(start_time) * 1000
    last_key = int(end_time) * 1000
    first_entry = [{'time': first_key, 'fatal': 0, 'error': 0, 'warning': 0}]
    last_entry = [{'time': last_key, 'fatal': 0, 'error': 0, 'warning': 0}]

    data = {'data': first_entry + result + last_entry}
    logger.debug("[bad_event_histogram]: data = %s", json.dumps(data))
    return HttpResponse(json.dumps(data), content_type="application/json")


def log_search_data(request):

    conn = LogData.get_connection(settings.ES_SERVER)

    keylist = ['@timestamp', 'loglevel', 'component', 'host', 'message',
               'path', 'pid', 'program', 'request_id_list', 'type',
               'received_at']

    end_ts = int(request.GET.get('end_time'))
    start_ts = int(request.GET.get('start_time'))
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
        search_text=request.GET.get('sSearch', None),
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
    options = {'month': timedelta(weeks=4), 'week': timedelta(weeks=1),
               'day': timedelta(days=1), 'hour': timedelta(hours=1),
               'minute': timedelta(minutes=1)}
    return end - options[interval]


def _unload_start_end_interval(request):
    interval = request.GET.get('interval', '1h')
    logger.debug("[_unload_start_end_interval] interval = %s", interval)
    end_time = request.GET.get('end_time',
                               calendar.timegm(
                                   datetime.now(tz=pytz.utc).utctimetuple()))
    end_dt = datetime.fromtimestamp(int(end_time), tz=pytz.utc)
    start_time = request.GET.get('start_time',
                                 calendar.timegm(
                                     _calc_start('month', end_dt).
                                     utctimetuple()))
    start_dt = datetime.fromtimestamp(int(start_time), tz=pytz.utc)
    return (start_dt, end_dt, interval)


def _get_claims_metric_stats(start_dt, end_dt, interval, method_name,
                             custom_fields):
    conn = LogData.get_connection(settings.ES_SERVER)
    ld = LogData()
    raw_data = getattr(ld, method_name)(conn, start_dt, end_dt, interval)
    logger.debug("[%s] raw_data = %s", method_name, json.dumps(raw_data))
    response = []
    for date_bucket in raw_data['aggregations']['events_by_date']['buckets']:
        item = {
            'time': date_bucket['key'],
            'max_total': 0,
            'avg_total': 0,
            custom_fields['max']: 0,
            custom_fields['avg']: 0
        }
        for host_bucket in date_bucket['events_by_host']['buckets']:
            item['max_total'] += (host_bucket['max_total']).get('value', 0)
            item['avg_total'] += (host_bucket['avg_total']).get('value', 0)
            item[custom_fields['max']] += (host_bucket[custom_fields['max']]).\
                get('value', 0)
            item[custom_fields['avg']] += (host_bucket[custom_fields['avg']]).\
                get('value', 0)

        response.append(item)

    # let's make sure we fill the complete graph by putting a record at the
    # front and back
    first_item = [{
        'time': int(calendar.timegm(start_dt.utctimetuple())) * 1000,
        'max_total': 0,
        'avg_total': 0,
        custom_fields['max']: 0,
        custom_fields['avg']: 0
    }]
    last_item = [{
        'time': int(calendar.timegm(end_dt.utctimetuple())) * 1000,
        'max_total': 0,
        'avg_total': 0,
        custom_fields['max']: 0,
        custom_fields['avg']: 0
    }]
    response = first_item + response + last_item
    return response


def get_cpu_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    vcpu_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                             'gsl_virt_cpu_stats', cf)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    cpu_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                            'gsl_phys_cpu_stats', cf)
    logger.debug("cpu_response = " + json.dumps(cpu_response))
    cpu_times = [e['time'] for e in cpu_response]
    vcpu_times = [e['time'] for e in vcpu_response]

    all_times = set(cpu_times + vcpu_times)
    response = []
    for t in all_times:
        to_append = {'time': t}
        if t in vcpu_times:
            rec = (item for item in vcpu_response if item["time"] == t).next()
            to_append['virt_cpu_max_total'] = rec['max_total']
            to_append['virt_cpu_avg_total'] = rec['avg_total']
            to_append['virt_cpu_max_used'] = rec['max_total'] - rec['max_free']
            to_append['virt_cpu_avg_used'] = rec['avg_total'] - rec['avg_free']
        else:
            to_append['virt_cpu_max_total'] = 0
            to_append['virt_cpu_avg_total'] = 0
            to_append['virt_cpu_max_used'] = 0
            to_append['virt_cpu_avg_used'] = 0

        if t in cpu_times:
            rec = (item for item in cpu_response if item["time"] == t).next()
            to_append['phys_cpu_max_total'] = rec['max_total']
            to_append['phys_cpu_avg_total'] = rec['avg_total']
            to_append['phys_cpu_max_used'] = rec['max_used']
            to_append['phys_cpu_avg_used'] = rec['avg_used']
        else:
            to_append['phys_cpu_max_total'] = 0
            to_append['phys_cpu_avg_total'] = 0
            to_append['phys_cpu_max_used'] = 0
            to_append['phys_cpu_avg_used'] = 0

        response.append(to_append)

    sorted_response = sorted(response, key=lambda k: k['time'])
    return HttpResponse(json.dumps(sorted_response),
                        content_type="application/json")


def get_mem_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    vmem_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                             'gsl_virt_mem_stats', cf)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    pmem_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                             'gsl_phys_mem_stats', cf)
    logger.debug("mem_response = " + json.dumps(pmem_response))
    vmem_times = [e['time'] for e in vmem_response]
    pmem_times = [e['time'] for e in pmem_response]

    all_times = set(pmem_times + vmem_times)
    response = []
    for t in all_times:
        to_append = {'time': t}
        if t in vmem_times:
            rec = (item for item in vmem_response if item["time"] == t).next()
            to_append['virt_mem_max_total'] = rec['max_total']
            to_append['virt_mem_avg_total'] = rec['avg_total']
            to_append['virt_mem_max_used'] = rec['max_total'] - rec['max_free']
            to_append['virt_mem_avg_used'] = rec['avg_total'] - rec['avg_free']
        else:
            to_append['virt_mem_max_total'] = 0
            to_append['virt_mem_avg_total'] = 0
            to_append['virt_mem_max_used'] = 0
            to_append['virt_mem_avg_used'] = 0

        if t in pmem_times:
            rec = (item for item in pmem_response if item["time"] == t).next()
            to_append['phys_mem_max_total'] = rec['max_total']
            to_append['phys_mem_avg_total'] = rec['avg_total']
            to_append['phys_mem_max_used'] = rec['max_used']
            to_append['phys_mem_avg_used'] = rec['avg_used']
        else:
            to_append['phys_mem_max_total'] = 0
            to_append['phys_mem_avg_total'] = 0
            to_append['phys_mem_max_used'] = 0
            to_append['phys_mem_avg_used'] = 0

        response.append(to_append)

    sorted_response = sorted(response, key=lambda k: k['time'])
    return HttpResponse(json.dumps(sorted_response),
                        content_type="application/json")


def get_disk_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    vdisk_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                              'gsl_virt_disk_stats', cf)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    pdisk_response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                              'gsl_phys_disk_stats', cf)
    logger.info("disk_response = " + json.dumps(pdisk_response))
    vdisk_times = [e['time'] for e in vdisk_response]
    pdisk_times = [e['time'] for e in pdisk_response]

    all_times = set(pdisk_times + vdisk_times)
    response = []
    for t in all_times:
        to_append = {'time': t}
        if t in vdisk_times:
            rec = (item for item in vdisk_response if item["time"] == t).next()
            to_append['virt_disk_max_total'] = rec['max_total']
            to_append['virt_disk_avg_total'] = rec['avg_total']
            to_append['virt_disk_max_used'] = \
                rec['max_total'] - rec['max_free']
            to_append['virt_disk_avg_used'] = \
                rec['avg_total'] - rec['avg_free']
        else:
            to_append['virt_disk_max_total'] = 0
            to_append['virt_disk_avg_total'] = 0
            to_append['virt_disk_max_used'] = 0
            to_append['virt_disk_avg_used'] = 0

        if t in pdisk_times:
            rec = (item for item in pdisk_response if item["time"] == t).next()
            to_append['phys_disk_max_total'] = rec['max_total']
            to_append['phys_disk_avg_total'] = rec['avg_total']
            to_append['phys_disk_max_used'] = rec['max_used']
            to_append['phys_disk_avg_used'] = rec['avg_used']
        else:
            to_append['phys_disk_max_total'] = 0
            to_append['phys_disk_avg_total'] = 0
            to_append['phys_disk_max_used'] = 0
            to_append['phys_disk_avg_used'] = 0

        response.append(to_append)

    sorted_response = sorted(response, key=lambda k: k['time'])
    return HttpResponse(json.dumps(sorted_response),
                        content_type="application/json")


def get_virt_cpu_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_virt_cpu_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


def get_phys_cpu_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_phys_cpu_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


def get_virt_mem_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_virt_mem_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


def get_phys_mem_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_phys_mem_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


def get_virt_disk_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_free', 'avg': 'avg_free'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_virt_disk_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


def get_phys_disk_stats(request):
    (start_dt, end_dt, interval) = _unload_start_end_interval(request)
    cf = {'max': 'max_used', 'avg': 'avg_used'}
    response = _get_claims_metric_stats(start_dt, end_dt, interval,
                                        'gsl_phys_disk_stats', cf)
    return HttpResponse(json.dumps(response), content_type="application/json")


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
