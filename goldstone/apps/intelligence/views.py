from __future__ import unicode_literals
# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

import calendar
from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.generic import TemplateView
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

    keylist = ['@timestamp', 'loglevel', 'component', 'host',
               'openstack_message', 'log_message'
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

    sort_index = int(request.GET.get('order[0][column]'))
    sort_col = keylist[sort_index] if sort_index else keylist[0]
    sort_dir_in = request.GET.get('order[0][dir]=asc')
    sort_dir = sort_dir_in if sort_dir_in else "desc"

    ld = LogData()
    rs = ld.get_log_data(
        conn,
        datetime.fromtimestamp(start_ts, tz=pytz.utc),
        datetime.fromtimestamp(end_ts, tz=pytz.utc),
        int(request.GET.get('start')),
        int(request.GET.get('length')),
        level_filters,
        search_text=request.GET.get('search[value]', None),
        sort=["".join([sort_col, ":", sort_dir])],
    )

    aa_data = []
    for rec in rs['hits']['hits']:
        kv = rec['_source']
        aa_data.append([
            kv['@timestamp'] if '@timestamp' in kv else "",
            kv['loglevel'] if 'loglevel' in kv else "",
            kv['component'] if 'component' in kv else "",
            kv['host'] if 'host' in kv else "",
            kv['openstack_message'] if 'openstack_message' in kv else kv[
                'log_message'],
            kv['path'] if 'path' in kv else "",
            kv['pid'] if 'pid' in kv else "",
            kv['program'] if 'program' in kv else "",
            kv['request_id_list'] if 'request_id_list' in kv else "",
            kv['type'] if 'type' in kv else "",
            kv['received_at'] if 'received_at' in kv else ""])

    response = {
        "draw": int(request.GET.get('draw')),
        # This should be the result count without filtering, but no obvious
        # way to get that without doing the query twice.
        "recordsTotal": rs['hits']['total'],
        "recordsFiltered": rs['hits']['total'],
        "data": aa_data
    }

    return HttpResponse(json.dumps(response),
                        content_type="application/json")


def _calc_start(interval, end):
    options = {'month': timedelta(weeks=4), 'week': timedelta(weeks=1),
               'day': timedelta(days=1), 'hour': timedelta(hours=1),
               'minute': timedelta(minutes=1)}
    return end - options[interval]
