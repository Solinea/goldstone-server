"""Tenants URLconf."""
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

from rest_framework_extensions.routers import ExtendedDefaultRouter
from .views import TenantsViewSet, UserViewSet, CloudViewSet

# Views handled by DjangoRestFramework ViewSets, with drf-extensions help.
router = ExtendedDefaultRouter(trailing_slash=False)

tenants_routes = router.register(r'tenants[/]?',        # pylint: disable=C0103
                                 TenantsViewSet,
                                 base_name="tenants")
tenants_routes.register(r'users[/]?',
                        UserViewSet,
                        base_name="tenants-users",
                        parents_query_lookups=["tenant"])

tenants_routes.register(r'cloud[/]?',
                        CloudViewSet,
                        base_name="tenants-cloud",
                        parents_query_lookups=["tenant"])

urlpatterns = router.urls
