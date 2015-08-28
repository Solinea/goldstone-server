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
    """Return data from ES about cinder services"""
    _DOC_TYPE = 'cinder_service_list'
    _INDEX_PREFIX = 'goldstone-'


class VolumesData(TopologyData):
    """Return data from ES about cinder volumes"""
    _DOC_TYPE = 'cinder_volume_list'
    _INDEX_PREFIX = 'goldstone-'


class BackupsData(TopologyData):
    """Return data from ES about cinder backups"""
    _DOC_TYPE = 'cinder_backup_list'
    _INDEX_PREFIX = 'goldstone-'


class SnapshotsData(TopologyData):
    """Return data from ES about cinder snapshots"""
    _DOC_TYPE = 'cinder_snapshot_list'
    _INDEX_PREFIX = 'goldstone-'


class VolTypesData(TopologyData):
    """Return data from ES about cinder volume types"""
    _DOC_TYPE = 'cinder_voltype_list'
    _INDEX_PREFIX = 'goldstone-'


class EncryptionTypesData(TopologyData):
    """Return data from ES about cinder encryption types"""
    _DOC_TYPE = 'cinder_encrypttype_list'
    _INDEX_PREFIX = 'goldstone-'


class TransfersData(TopologyData):
    """Return data from ES about cinder transfers"""
    _DOC_TYPE = 'cinder_transfer_list'
    _INDEX_PREFIX = 'goldstone-'
