"""Nova app URLconf."""
# Copyright 2015 Solinea, Inc.
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
from django.conf.urls import url, patterns
from rest_framework.routers import DefaultRouter

from .views import AgentsDataViewSet, \
    AggregatesDataViewSet, AvailZonesDataViewSet, CloudpipesDataViewSet, \
    FlavorsDataViewSet, FloatingIpPoolsDataViewSet, HostsDataViewSet, \
    HypervisorsDataViewSet, NetworksDataViewSet, SecGroupsDataViewSet, \
    ServersDataViewSet, ServicesDataViewSet, SpawnsAggView

# Views handled by DjangoRestFramework ViewSets.
router = DefaultRouter()
router.register(r'^agents', AgentsDataViewSet, base_name='nova-agents')
router.register(r'^aggregates',
                AggregatesDataViewSet,
                base_name='nova-aggregates')
router.register(r'^availability_zones',
                AvailZonesDataViewSet,
                base_name='nova-availability-zones')
router.register(r'^cloudpipes',
                CloudpipesDataViewSet,
                base_name='nova-cloudpipes')
router.register(r'^flavors', FlavorsDataViewSet, base_name='nova-flavors')
router.register(r'^floating_ip_pools',
                FloatingIpPoolsDataViewSet,
                base_name='nova-floating-ip-pools')
router.register(r'^hosts', HostsDataViewSet, base_name='nova-hosts')
router.register(r'^hypervisors',
                HypervisorsDataViewSet,
                base_name='nova-hypervisors')
router.register(r'^networks', NetworksDataViewSet, base_name='nova-networks')
router.register(r'^security_groups',
                SecGroupsDataViewSet,
                base_name='nova-security-groups')
router.register(r'^servers', ServersDataViewSet, base_name='nova-servers')
router.register(r'^services', ServicesDataViewSet, base_name='nova-services')

urlpatterns = router.urls

# Other views.
urlpatterns += patterns(
    '',
    url(r'^hypervisor/spawns/', SpawnsAggView.as_view()),
    )
