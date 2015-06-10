"""Core URLconf."""
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

from .views import MetricDataListView, ReportDataListView, \
    MetricNamesAggView, ReportNamesAggView, MetricAggView, NavTreeView, \
    ResourceTypeList, ResourceTypeRetrieve, ResourcesList, ResourcesRetrieve, \
    EventSearchView
    # EventSummarizeView, 

urlpatterns = patterns(
    '',
    # url(r'^events/summarize/', EventSummarizeView.as_view()),
    url(r'^events/search/', EventSearchView.as_view()),
    url(r'^metrics/$', MetricDataListView.as_view()),
    url(r'^metrics/summarize/', MetricAggView.as_view()),
    url(r'^metric_names/', MetricNamesAggView.as_view()),
    url(r'^nav_tree/', NavTreeView.as_view()),
    url(r'^reports/', ReportDataListView.as_view()),
    url(r'^report_names/', ReportNamesAggView.as_view()),
    url(r'^resource_types/$', ResourceTypeList.as_view()),
    url(r'^resource_types/(?P<unique_id>.+)/$',
        ResourceTypeRetrieve.as_view()),
    url(r'^resources/$', ResourcesList.as_view()),
    url(r'^resources/(?P<uuid>.+)/$', ResourcesRetrieve.as_view()),
)
