"""Logging URLconf."""
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
from django.conf.urls import patterns, url
from goldstone.core.views import SavedSearchViewSet

urlpatterns = patterns(
    '',
    url(r'^search/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid':'55b19303-4fd2-4216-95cb-75a4f39b763c'}),
)
