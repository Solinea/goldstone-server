"""Core URLconf."""
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
from django.conf.urls import url, patterns

from .views import MetricDataListView, ReportDataListView, MetricNamesAggView, \
    ReportNamesAggView
from rest_framework.routers import DefaultRouter

router = DefaultRouter(trailing_slash=False)

urlpatterns = router.urls
urlpatterns += patterns('', url(r'^reports[/]?$', ReportDataListView.as_view(),
                        name='reports_view'))
urlpatterns += patterns('', url(r'^report_names[/]?$',
                                ReportNamesAggView.as_view(),
                        name='report_name_agg_view'))
urlpatterns += patterns('', url(r'^metrics[/]?$', MetricDataListView.as_view(),
                        name='metrics_view'))
urlpatterns += patterns('', url(r'^metric_names[/]?$',
                                MetricNamesAggView.as_view(),
                        name='metric_name_agg_view'))
