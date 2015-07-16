"""Cinder URLconf."""
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
from .views import VolumesDataView, \
    BackupsDataView, SnapshotsDataView, ServicesDataView, \
    VolumeTypesDataView, TransfersDataView

# Views handled by DjangoRestFramework Views.
urlpatterns = patterns(
    '',
    url(r'^backups', BackupsDataView.as_view(), name='cinder-backups'),
    url(r'^services', ServicesDataView.as_view(), name='cinder-services'),
    url(r'^snapshots', SnapshotsDataView.as_view(), name='cinder-snapshots'),
    url(r'^transfers', TransfersDataView.as_view(), name='cinder-transfers'),
    url(r'^volumes', VolumesDataView.as_view(), name='cinder-volumes'),
    url(r'^volume_types',
        VolumeTypesDataView.as_view(),
        name='cinder-volume-types'),
)
