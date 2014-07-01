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
from goldstone.utils import NoResourceFound

__author__ = 'John Stanford'

from goldstone.views import *
from .models import *
import logging

logger = logging.getLogger(__name__)


class ReportView(TopLevelView):
    template_name = 'keystone_report.html'


class AuthApiPerfView(ApiPerfView):
    my_template_name = 'keystone_api_perf.html'

    def _get_data(self, context):
        return ApiPerfData().get(context['start_dt'], context['end_dt'],
                                 context['interval'])


class DiscoverView(TopologyView):

    def my_template_name(self):
        return 'keystone_discover.html'

    def __init__(self):
        self.endpoints = EndpointsData().get()

    def _get_endpoint_regions(self):
        if self.endpoints is None:
            return []
        else:
            return set(
                [
                    r['region']
                    for ep in self.endpoints
                    for r in ep['_source']['endpoints']
                ])

    def _get_regions(self):
        return [{"rsrcType": "region", "label": r} for r in
                self._get_endpoint_regions()]

    def _populate_regions(self):
        result = []
        if self.endpoints is None or len(self.endpoints) == 0:
                raise NoResourceFound(
                    "No keystone endpoints found in database")
        updated = self.endpoints[0]['_source']['@timestamp']
        for r in self._get_endpoint_regions():
            result.append(
                {"rsrcType": "region",
                 "label": r,
                 "info": {"last_updated": updated},
                 "children": [
                     {
                         "rsrcType": "endpoints-leaf",
                         "label": "endpoints",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "roles-leaf",
                         "label": "roles",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "services-leaf",
                         "label": "services",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "tenants-leaf",
                         "label": "tenants",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     },
                     {
                         "rsrcType": "users-leaf",
                         "label": "users",
                         "region": r,
                         "info": {
                             "last_update": updated
                         }
                     }
                 ]}
            )

        return result

    def _build_topology_tree(self):
        try:
            rl = self._populate_regions()

            if len(rl) > 1:
                return {"rsrcType": "cloud", "label": "Cloud", "children": rl}
            else:
                return rl[0]
        except (IndexError, NoResourceFound):
            return {"rsrcType": "error", "label": "No data found"}
        except GoldstoneAuthError:
            raise


class EndpointsDataView(JSONView):
    def __init__(self):
        self.data = EndpointsData().get()
        self.key = 'endpoints'


class RolesDataView(JSONView):
    def __init__(self):
        self.data = RolesData().get()
        self.key = 'roles'


class ServicesDataView(JSONView):
    def __init__(self):
        self.data = ServicesData().get()
        self.key = 'services'


class TenantsDataView(JSONView):
    def __init__(self):
        self.data = TenantsData().get()
        self.key = 'tenants'


class UsersDataView(JSONView):
    def __init__(self):
        self.data = UsersData().get()
        self.key = 'users'
