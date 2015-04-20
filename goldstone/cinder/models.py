"""Cinder models."""
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
from goldstone.models import TopologyData


class ServicesData(TopologyData):
    _DOC_TYPE = 'cinder_service_list'
    _INDEX_PREFIX = 'goldstone-'


class VolumesData(TopologyData):
    _DOC_TYPE = 'cinder_volume_list'
    _INDEX_PREFIX = 'goldstone-'


class BackupsData(TopologyData):
    _DOC_TYPE = 'cinder_backup_list'
    _INDEX_PREFIX = 'goldstone-'


class SnapshotsData(TopologyData):
    _DOC_TYPE = 'cinder_snapshot_list'
    _INDEX_PREFIX = 'goldstone-'


class VolTypesData(TopologyData):
    _DOC_TYPE = 'cinder_voltype_list'
    _INDEX_PREFIX = 'goldstone-'


class EncryptionTypesData(TopologyData):
    _DOC_TYPE = 'cinder_encrypttype_list'
    _INDEX_PREFIX = 'goldstone-'


class TransfersData(TopologyData):
    _DOC_TYPE = 'cinder_transfer_list'
    _INDEX_PREFIX = 'goldstone-'
