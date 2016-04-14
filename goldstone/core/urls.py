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

from .views import SavedSearchViewSet, AlertDefinitionViewSet, AlertViewSet, \
    ProducerViewSet, EmailProducerViewSet, MonitoredServiceViewSet

router = DefaultRouter()

router.register(r'saved_search',
                SavedSearchViewSet,
                base_name="saved_search")
router.register(r'alert_definition',
                AlertDefinitionViewSet,
                base_name="alert_definition")
router.register(r'alert',
                AlertViewSet,
                base_name="alert")
router.register(r'producer',
                ProducerViewSet,
                base_name="producer")
router.register(r'email_producer',
                EmailProducerViewSet,
                base_name="email_producer")
router.register(r'monitored_service',
                MonitoredServiceViewSet,
                base_name="monitored_service")

urlpatterns = router.urls
urlpatterns += patterns(
    '',
    url(r'^logs/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '55b19303-4fd2-4216-95cb-75a4f39b763c'}),
    url(r'^api-calls/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '18936ecd-11f5-413c-9e70-fc9a7dd037e3'}),
    url(r'^events/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '7906893c-16dc-4ab3-96e0-8f0054bd4cc1'}),
    url(r'^metrics/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': 'a3f34f00-967b-40a2-913e-ba10afdd611b'}),
    url(r'^canary/', SavedSearchViewSet.as_view(
        {'get': 'results'}), {'uuid': '139851f2-1329-4826-9c70-c154a6c102f2'}),
)
