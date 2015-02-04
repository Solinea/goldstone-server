"""Cinder URLconf."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf.urls import patterns, url

from .views import ReportView, ApiPerfView, VolumesViewSet, BackupsViewSet, \
    SnapshotsViewSet, CinderServicesViewSet, VolumeTypesViewSet, \
    TransfersDataViewSet

urlpatterns = patterns('',
    url(r'^api_perf[/]?$', ApiPerfView.as_view(), name='cinder-api-perf'),
    url(r'^backups[/]?$', BackupsDataView.as_view(), name='cinder-backups'),
    url(r'^report[/]?$', ReportView.as_view(), name='report_list_view'),
    url(r'^services[/]?$', ServicesDataView.as_view(), name='cinder-services'),
    url(r'^snapshots[/]?$',
        SnapshotsDataView.as_view(),
        name='cinder-snapshots'),
    url(r'^transfers[/]?$',
        TransfersDataView.as_view(),
        name='cinder-transfers'),
    url(r'^volumes[/]?$', VolumesDataView.as_view(), name='cinder-volumes'),
    url(r'^volume_types[/]?$',
        VolumeTypesDataView.as_view(),
        name='cinder-volume-types'),
)
