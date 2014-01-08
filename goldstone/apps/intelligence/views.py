# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#
from django.http import HttpResponse

from django.views.generic import TemplateView
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import LogData
from datetime import datetime, timedelta
import pytz
import json


class IntelSearchView(TemplateView):
    template_name = 'search.html'


class IntelErrorsView(TemplateView):
    template_name = 'errors.html'

class IntelLogCockpitView(TemplateView):
    template_name = "log-cockpit.html"

def log_cockpit_data(request):
    #TODO move static reference to config settings
    conn = LogData.get_connection("10.10.11.121:9200")
    comps = LogData.get_components(conn)
    #TODO set this to "now"
    end = datetime.now(tz=pytz.utc)
    #TODO parameterize static reference
    start = end - timedelta(weeks=4)
    #TODO parameterize interval
    raw_data = LogData.get_err_and_warn_hists(conn, start, end, 'day',
                                              comps)

    #print("raw_data = %s" % raw_data)
    cooked_data = []

    for comp, facets in raw_data.items():
        # build up a flat list for d3
        errs_list = facets['err_facet']['entries']
        warns_list = facets['warn_facet']['entries']
        data = []

        err_times = set([t['time'] for t in errs_list])
        warn_times = set([t['time'] for t in warns_list])
        intersect = err_times & warn_times
        #print("intersect contains: %s" %intersect)
        #print("original warns_list has %d elements" % len(warns_list))

        warns_list = [warn for warn in warns_list
                      if warn['time'] not in intersect]
        #print("updated warns_list has %d elements" % len(warns_list))

        for err in errs_list:
            err['type'] = 'error'
            err['component'] = comp
            #err['time'] = datetime.utcfromtimestamp(err['time'])
        for warn in warns_list:
            warn['type'] = 'warning'
            warn['component'] = comp
            #warn['time'] = datetime.utcfromtimestamp(warn['time'])

        cooked_data += errs_list
        cooked_data += warns_list


    comps = LogData.get_components(conn)

    data = {
                'components': comps,
                'data': cooked_data
           }
    return HttpResponse(json.dumps(data), content_type="application/json")



