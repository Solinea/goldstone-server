"""Cinder views."""
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
from goldstone.core.utils import JsonReadOnlyViewSet
from goldstone.views import TopLevelView
from .models import ServicesData, VolumesData, \
    BackupsData, SnapshotsData, VolTypesData, TransfersData


class VolumesDataViewSet(JsonReadOnlyViewSet):
    model = VolumesData
    key = 'volumes'
    zone_key = 'availability_zone'


class BackupsDataViewSet(JsonReadOnlyViewSet):
    model = BackupsData
    key = 'backups'
    zone_key = 'availability_zone'


class SnapshotsDataViewSet(JsonReadOnlyViewSet):
    model = SnapshotsData
    key = 'snapshots'


class ServicesDataViewSet(JsonReadOnlyViewSet):
    model = ServicesData
    key = 'services'
    zone_key = 'zone'


class VolumeTypesDataViewSet(JsonReadOnlyViewSet):
    model = VolTypesData
    key = 'volume_types'


class TransfersDataViewSet(JsonReadOnlyViewSet):
    model = TransfersData
    key = 'transfers'
