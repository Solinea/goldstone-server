# Copyright 2014 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

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
