from goldstone.views import *
from .models import ApiPerfData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'glance_discover.html'


class ReportView(TopLevelView):
    template_name = 'glance_report.html'


class ImageApiPerfView(ApiPerfView):
    my_template_name = 'image_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])
