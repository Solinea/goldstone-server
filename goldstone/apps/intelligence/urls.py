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

__author__ = 'John Stanford'

from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns(
    '',
    # view calls
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    # data calls
    url(r'^log/cockpit/data[/]?$',
        log_event_histogram, name='bad-event-data'),
    url(r'^log/search/data[/]?$', log_search_data,
        name='intel-log-search-data'),
    url(r'^host_presence_stats[/]?$', host_presence_stats,
        name='host_presence_stats'),
)
