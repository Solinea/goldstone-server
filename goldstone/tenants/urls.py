"""Tenants URLconf."""
# Copyright 2015 Solinea, Inc.
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

from rest_framework_extensions.routers import ExtendedDefaultRouter
from .views import TenantsViewSet, UserViewSet

# Views handled by DjangoRestFramework ViewSets, with drf-extensions help.
router = ExtendedDefaultRouter(trailing_slash=False)

router.register(r'tenants[/]?', TenantsViewSet, base_name="tenants")\
      .register(r'users[/]?',
                UserViewSet,
                base_name="tenants-users",
                parents_query_lookups=["uuid"])

urlpatterns = router.urls
