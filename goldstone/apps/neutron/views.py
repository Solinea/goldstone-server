from goldstone.views import *
from .models import ApiPerfData
import logging

logger = logging.getLogger(__name__)


class DiscoverView(TopLevelView):
    template_name = 'neutron_discover.html'


class ReportView(TopLevelView):
    template_name = 'neutron_report.html'


class AgentListApiPerfView(ApiPerfView):
    my_template_name = 'agent_list_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])
