"""Keystone URLconf."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from rest_framework.routers import DefaultRouter
from .views import EndpointsDataViewSet, RolesDataViewSet, \
    ServicesDataViewSet, TenantsDataViewSet, UsersDataViewSet

# Views handled by DjangoRestFramework ViewSets.
router = DefaultRouter(trailing_slash=False)
router.register(r'^endpoints[/]?$',
                EndpointsDataViewSet,
                base_name='keystone-endpoints')
router.register(r'^roles[/]?$', RolesDataViewSet, base_name='keystone-roles')
router.register(r'^services[/]?$',
                ServicesDataViewSet,
                base_name='keystone-services')
router.register(r'^tenants[/]?$',
                TenantsDataViewSet,
                base_name='keystone-tenants')
router.register(r'^users[/]?$', UsersDataViewSet, base_name='keystone-users')

urlpatterns = router.urls
