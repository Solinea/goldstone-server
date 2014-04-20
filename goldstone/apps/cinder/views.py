from goldstone.views import *
from .models import ApiPerfData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'cinder_discover.html'


class ReportView(TopLevelView):
    template_name = 'cinder_report.html'


class VolumeListApiPerfView(ApiPerfView):
    my_template_name = 'volume_list_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])
