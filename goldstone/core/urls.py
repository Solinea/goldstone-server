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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf.urls import url, patterns

from .views import MetricDataListView, ReportDataListView, MetricNamesAggView, \
    ReportNamesAggView, MetricAggView, NavTreeView

urlpatterns = patterns(
    '',
    url(r'^reports[/]?$', ReportDataListView.as_view()),
    url(r'^report_names[/]?$', ReportNamesAggView.as_view()),
    url(r'^metrics[/]?$', MetricDataListView.as_view()),
    url(r'^metrics/summarize[/]?$', MetricAggView.as_view()),
    url(r'^metric_names[/]?$', MetricNamesAggView.as_view()),
    url(r'^nav_tree[/]?$', NavTreeView.as_view())
)
