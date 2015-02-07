"""Cinder URLconf."""
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
from django.conf.urls import patterns, url
from rest_framework.routers import DefaultRouter
from .views import ReportView, ApiPerfView, JsonReadOnlyViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'^(?P<base>backups)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-backups')
router.register(r'^(?P<base>services)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-services')
router.register(r'^(?P<base>snapshots)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-snapshots')
router.register(r'^(?P<base>transfers)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-transfers')
router.register(r'^(?P<base>volumes)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-volumes')
router.register(r'^(?P<base>volume_types)[/]?$',
                JsonReadOnlyViewSet,
                base_name='cinder-volume-types')

urlpatterns = router.urls
urlpatterns += patterns('',
                        url(r'^api_perf[/]?$',
                            ApiPerfView.as_view(),
                            name='cinder-api-perf'),
                        url(r'^report[/]?$',
                            ReportView.as_view(),
                            name='cinder-report-view'),
                        )
