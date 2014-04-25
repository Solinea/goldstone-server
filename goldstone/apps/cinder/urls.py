# Copyright 2014 Solinea, Inc.
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

__author__ = 'John Stanford'

from django.conf.urls import patterns, url
from .views import *

urlpatterns = patterns(
    '',
    # url(r'^discover[/]?$', DiscoverView.as_view(),
    #     name='cinder-discover-view'),
    url(r'^report[/]?$', ReportView.as_view(),
        name='cinder-report-view'),
    url(r'^api_perf[/]?$', ServiceListApiPerfView.as_view(),
        name='cinder-api-perf'),
)
