from django.shortcuts import render
from goldstone.views import *
from .models import ApiPerfData

class DiscoverView(TopLevelView):
    template_name = 'discover.html'


class ReportView(TopLevelView):
    template_name = 'report.html'


class ApiPerfView(ApiPerfView):
    template_name = 'api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])
