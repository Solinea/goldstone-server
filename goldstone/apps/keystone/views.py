"""Keystone views."""
# Copyright 2014 - 2015 Solinea, Inc.
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
import logging
from goldstone.views import JSONView, TopLevelView, ApiPerfView
from .models import EndpointsData, RolesData, ServicesData, TenantsData, \
    UsersData, ApiPerfData

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'keystone_report.html'


class AuthApiPerfView(ApiPerfView):
    my_template_name = 'keystone_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class EndpointsDataView(JSONView):
    model = EndpointsData
    key = 'endpoints'


class RolesDataView(JSONView):
    model = RolesData
    key = 'roles'


class ServicesDataView(JSONView):
    model = ServicesData
    key = 'services'


class TenantsDataView(JSONView):
    model = TenantsData
    key = 'tenants'


class UsersDataView(JSONView):
    model = UsersData
    key = 'users'
