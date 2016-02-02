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
from rest_framework.routers import DefaultRouter

from .views import ResourceTypeList, ResourceTypeRetrieve, ResourcesList, \
    ResourcesRetrieve, TopologyView, SavedSearchViewSet, AlertSearchViewSet, \
    AlertViewSet

router = DefaultRouter()
router.register(r'saved_search',
                SavedSearchViewSet,
                base_name="saved_search")
router.register(r'alert_search',
                AlertSearchViewSet,
                base_name="alert_search")
router.register(r'alert',
                AlertViewSet,
                base_name="alert")

urlpatterns = router.urls
urlpatterns += patterns(
    '',
    url(r'^topology/', TopologyView.as_view()),
    url(r'^resource_types/$', ResourceTypeList.as_view()),
    url(r'^resource_types/(?P<unique_id>.+)/$',
        ResourceTypeRetrieve.as_view()),
    url(r'^resources/$', ResourcesList.as_view()),
    url(r'^resources/(?P<uuid>.+)/$', ResourcesRetrieve.as_view()),
    url(r'^logs/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '55b19303-4fd2-4216-95cb-75a4f39b763c'}),
    url(r'^api-calls/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '18936ecd-11f5-413c-9e70-fc9a7dd037e3'}),
    url(r'^events/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '7906893c-16dc-4ab3-96e0-8f0054bd4cc1'}),
    url(r'^metrics/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': 'a3f34f00-967b-40a2-913e-ba10afdd611b'}),
    url(r'^agent/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': 'a3f34f00-967b-40a2-913e-ba10afdd611b'}),
    url(r'^agent/', AlertSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '4c010ac2-d437-460a-a6cf-5234eceff5b2'}),
    url(r'^agent/', AlertViewSet.as_view(
        {'get': 'get_queryset'})),
)
