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
from django.conf.urls import url, patterns

__author__ = 'John Stanford'

from .views import NodeViewSet, EventViewSet, MetricViewSet, ReportViewSet, \
    ReportListView
from rest_framework.routers import DefaultRouter

router = DefaultRouter(trailing_slash=False)
router.register(r'nodes', NodeViewSet, base_name='node')
router.register(r'events', EventViewSet, base_name='event')
router.register(r'metrics', MetricViewSet, base_name='metric')
router.register(r'reports', ReportViewSet, base_name='report')
router.register(r'reports', ReportViewSet, base_name='report')

urlpatterns = router.urls
urlpatterns += patterns('',
                        url(r'^report_list[/]?$', ReportListView.as_view(),
                            name='report_list_view'))
