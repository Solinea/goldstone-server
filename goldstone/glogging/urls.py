"""Logging URLconf."""
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
from .views import LogDataView, LogAggView, LogEventView, LogEventAggView

urlpatterns = patterns(
    '',
    url(r'^search[/]?$', LogDataView.as_view()),
    url(r'^summarize[/]?$', LogAggView.as_view()),
    url(r'^events/summarize[/]?$', LogEventAggView.as_view()),
    url(r'^events/search[/]?$', LogEventView.as_view())
)
